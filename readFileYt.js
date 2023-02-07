import fs from "fs";

let authorize;

try {
    const rawdata = fs.readFileSync('client_secret.json');
    authorize = JSON.parse(rawdata);
} catch (err) {
    console.error(err)
}

export {
    authorize
}