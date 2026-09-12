# rebuild.ps1
# Full rebuild + redeploy pipeline for the Laravel/React/Nginx kind-based Kubernetes setup.
#
# Usage:
#   .\rebuild.ps1                # rebuild + redeploy everything
#   .\rebuild.ps1 -Only backend  # rebuild + redeploy only laravel-api
#   .\rebuild.ps1 -Only frontend # rebuild + redeploy only react-frontend
#   .\rebuild.ps1 -Only nginx    # rebuild + redeploy only nginx
#   .\rebuild.ps1 -Migrate       # also run migrate:fresh --force at the end
#   .\rebuild.ps1 -SkipApply     # skip "kubectl apply -f k8s/" (use if namespace/objects already exist)

param(
    [ValidateSet("all", "backend", "frontend", "nginx")]
    [string]$Only = "all",

    [switch]$Migrate,
    [switch]$SkipApply
)

$ErrorActionPreference = "Stop"
$Node = "desktop-control-plane"
$Namespace = "laravel-k8s"

function Build-And-Import {
    param(
        [string]$ImageName,
        [string]$Dockerfile,
        [string]$AppLabel
    )

    Write-Host "`n==> Building $ImageName ..." -ForegroundColor Cyan
    docker build -t "$ImageName`:local" -f $Dockerfile . --no-cache
    if ($LASTEXITCODE -ne 0) { throw "docker build failed for $ImageName" }

    $tarFile = "$ImageName.tar"

    Write-Host "==> Saving $ImageName to $tarFile ..." -ForegroundColor Cyan
    docker save "$ImageName`:local" -o $tarFile
    if ($LASTEXITCODE -ne 0) { throw "docker save failed for $ImageName" }

    Write-Host "==> Copying $tarFile into node ($Node) ..." -ForegroundColor Cyan
    docker cp $tarFile "$Node`:/$tarFile"
    if ($LASTEXITCODE -ne 0) { throw "docker cp failed for $ImageName" }

    Write-Host "==> Importing $tarFile into containerd ..." -ForegroundColor Cyan
    docker exec -i $Node ctr --namespace=k8s.io images import "/$tarFile"
    if ($LASTEXITCODE -ne 0) { throw "ctr images import failed for $ImageName" }

    Write-Host "==> Deleting old pod(s) for app=$AppLabel ..." -ForegroundColor Cyan
    kubectl delete pod -n $Namespace -l "app=$AppLabel" --ignore-not-found

    Remove-Item $tarFile -Force -ErrorAction SilentlyContinue
}

if (-not $SkipApply) {
    Write-Host "==> Applying k8s manifests ..." -ForegroundColor Yellow
    kubectl apply -f k8s/
}

switch ($Only) {
    "backend" {
        Build-And-Import -ImageName "laravel-api" -Dockerfile "docker/php/Dockerfile" -AppLabel "laravel-api"
    }
    "frontend" {
        Build-And-Import -ImageName "react-frontend" -Dockerfile "docker/react/Dockerfile" -AppLabel "react-frontend"
    }
    "nginx" {
        Build-And-Import -ImageName "nginx-app" -Dockerfile "docker/nginx/Dockerfile" -AppLabel "nginx-server"
    }
    "all" {
        Build-And-Import -ImageName "laravel-api" -Dockerfile "docker/php/Dockerfile" -AppLabel "laravel-api"
        Build-And-Import -ImageName "nginx-app" -Dockerfile "docker/nginx/Dockerfile" -AppLabel "nginx-server"
        Build-And-Import -ImageName "react-frontend" -Dockerfile "docker/react/Dockerfile" -AppLabel "react-frontend"
    }
}

Write-Host "`n==> Waiting a few seconds for pods to start ..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
kubectl get pods -n $Namespace

if ($Migrate) {
    Write-Host "`n==> Running migrate:fresh --force ..." -ForegroundColor Yellow
    kubectl exec -n $Namespace deploy/laravel-api -- php artisan migrate:fresh --force
}

Write-Host "`nDone. Check pods above - all should be 1/1 Running (scheduler pods show Completed, which is normal)." -ForegroundColor Green