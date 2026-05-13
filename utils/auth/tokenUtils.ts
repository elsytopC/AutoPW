export function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(
            Buffer.from(token.split('.')[1], 'base64').toString(),
        );

        const currentTime = Math.floor(Date.now() / 1000);

        return payload.exp < currentTime;
    } catch (error) {
        return true;
    }
}