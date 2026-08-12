// import axios from "axios";
// import config from "./config";

// export const request = (url = "", method = "", data = {}) => {
//   const isFormData = data instanceof FormData;

//   return axios({
//     url: config.base_url + url,
//     method: method,
//     data: data,
//     headers: {
//       Accept: "application/json",

//       ...(isFormData ? {} : { "Content-Type": "application/json" }),
//     },
//   })
//     .then((res) => {
//       return res.data;
//     })
//     .catch((error) => {
//       console.log(error);
//       throw error;
//     });
// };

import axios from "axios";
import config from "./config";

export const request = (url = "", method = "", data = {}) => {
  const isFormData = data instanceof FormData;
  const token = localStorage.getItem("token"); // ← បន្ថែមបន្ទាត់នេះ

  return axios({
    url: config.base_url + url,
    method: method,
    data: data,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};
