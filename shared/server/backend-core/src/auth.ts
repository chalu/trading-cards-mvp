import * as bcrypt from 'bcrypt';

export const hashPswd = async (pswd: string): Promise<string> => {
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(pswd, salt);
    return hash;
};

export const comparePswd = async (pswd: string, hashed: string): Promise<boolean> => {
    const status = await bcrypt.compare(pswd, hashed);
    return status;
}