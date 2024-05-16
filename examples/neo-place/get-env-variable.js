module.exports.getEnvVariable = function (name) {
    console.log("Get Env", name, Boolean(process.env[name]));
    return process.env[name];
};
