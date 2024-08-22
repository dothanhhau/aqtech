import * as bcrypt from 'bcryptjs';

export const generatedKey = {
  ref(lengh: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < lengh; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toString();
  },

  async refTemp(password: string) {
    return bcrypt.hash(password, 12);
  },

  code(lengh: number) {
    var result = '';
    var characters = '0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < lengh; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toString();
  },
};
