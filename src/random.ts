const random = (length: number, chars: string) => {
    var result: string = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export const randomNumber = (length: number) => random(length, '0123456789')
export const randomAlphabet =  (length: number) => random(length, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
export const randomAlphabetNumber =  (length: number) => random(length, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')