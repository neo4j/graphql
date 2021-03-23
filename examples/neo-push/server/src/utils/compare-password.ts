import bcrypt from "bcrypt";

function comparePassword(plainText: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainText, hash, (err, result) => {
            if (err) {
                return reject(err);
            }

            return resolve(result);
        });
    });
}

export default comparePassword;
