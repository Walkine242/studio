export const leagues = [
  { id: 'winter', name: 'Winter League' },
  { id: 'spring', name: 'Spring League' },
  { id: 'summer', name: 'Summer League' },
  { id: 'fall', name: 'Fall League' },
];

/**
 * Returns the start and end date for a given year and league.
 * @param year The year for the league.
 * @param leagueId The ID of the league ('winter', 'spring', 'summer', 'fall').
 * @returns An object with startDate and endDate.
 */
export function getLeagueDateRange(year: number, leagueId: string): { startDate: Date, endDate: Date } {
  switch (leagueId) {
    case 'winter':
      // Winter league spans across two years, e.g., Dec 2023 to Feb 2024
      return {
        startDate: new Date(year - 1, 11, 1), // December 1st of previous year
        endDate: new Date(year, 2, 0),    // Last day of February of given year
      };
    case 'spring':
      return {
        startDate: new Date(year, 2, 1),  // March 1st
        endDate: new Date(year, 5, 0),   // Last day of May
      };
    case 'summer':
      return {
        startDate: new Date(year, 5, 1),  // June 1st
        endDate: new Date(year, 8, 0),   // Last day of August
      };
    case 'fall':
      return {
        startDate: new Date(year, 8, 1),  // September 1st
        endDate: new Date(year, 11, 0),  // Last day of November
      };
    default:
      // Default to the entire year if league is unknown
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
      };
  }
}
