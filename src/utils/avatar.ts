export const getAvatarUrl = (name: string | null | undefined, existingUrl?: string | null): string => {
    if (existingUrl) {
        return existingUrl;
    }
    const safeName = name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff`;
};