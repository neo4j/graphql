import { AES, enc } from "crypto-js";
import { v4 as uuidv4 } from "uuid";

export interface EncryptedData {
    encryptedPayload: string;
    hashKey: string;
}

export const encrypt = (payload: any): EncryptedData => {
    const hashKey = uuidv4();
    const encryptedPayload = AES.encrypt(JSON.stringify(payload), hashKey).toString();
    return { encryptedPayload, hashKey };
};

export const decrypt = (encryptedPayload: string, hashKey: string): string => {
    const bytes = AES.decrypt(encryptedPayload, hashKey);
    const decryptedData = JSON.parse(bytes.toString(enc.Utf8));
    return decryptedData;
};
