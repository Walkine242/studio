import data from './countries.json';

export interface Country {
    name: string;
    code: string;
    flag: string;
}

export const countries: Country[] = data.countries;

export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
}
