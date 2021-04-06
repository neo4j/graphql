import bcrypt from "bcrypt";

const saltRounds = 10;

function hashPassword(plainText: string): Promise<string> {
    return new Promise((resolve, reject) => {
        bcrypt.hash(plainText, saltRounds, (err, hash) => {
            if (err) {
                reject(err);
            }

            resolve(hash);
        });
    });
}

export default hashPassword;
