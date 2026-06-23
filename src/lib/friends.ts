import { getCountryByCode, type Country } from './countries';

export interface Friend {
    id: string;
    name: string;
    country: Country;
    avatar: string;
}

const allUsers: Omit<Friend, 'country'>[] = [
    { id: 'user_2', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?u=user_2' },
    { id: 'user_3', name: 'Yuki Tanaka', avatar: 'https://i.pravatar.cc/150?u=user_3' },
    { id: 'user_4', name: 'Fatima Al-Fahim', avatar: 'https://i.pravatar.cc/150?u=user_4' },
    { id: 'user_5', name: 'Sven Eriksson', avatar: 'https://i.pravatar.cc/150?u=user_5' },
    { id: 'user_6', name: 'Chloe Dubois', avatar: 'https://i.pravatar.cc/150?u=user_6' },
];

// This is a mock function to get a list of friends.
// In a real app, this would fetch data from a service.
export const getFriends = (): Friend[] => {
    // Let's say the current user follows user_2 and user_3
    const followingIds = ['user_2', 'user_3'];
    return allUsers
        .filter(user => followingIds.includes(user.id))
        .map(user => {
            const countryCode = user.id === 'user_2' ? 'USA' : user.id === 'user_3' ? 'JPN' : 'CAN';
            const country = getCountryByCode(countryCode);
            if (!country) {
                // Fallback or handle error if country not found
                throw new Error(`Country with code ${countryCode} not found.`);
            }
            return {
                ...user,
                country: country,
            }
        });
};
