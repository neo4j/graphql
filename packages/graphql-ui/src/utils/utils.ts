import { AES, enc } from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/comment/comment";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/lint/lint";
import "codemirror/keymap/sublime";
import "codemirror-graphql/hint";
import "codemirror-graphql/lint";
import "codemirror-graphql/info";
import "codemirror-graphql/jump";
import "codemirror-graphql/mode";
import "codemirror/theme/dracula.css";

// @ts-ignore
document.CodeMirror = CodeMirror;

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

export { CodeMirror };
