
import type { Meet, MeetEvent } from '@/lib/types';

const futureDate = new Date();
futureDate.setFullYear(2027);
futureDate.setMonth(0); // January
futureDate.setDate(1);
const futureDateString = futureDate.toISOString().split('T')[0] + 'T09:00:00Z';

const standardEvents: MeetEvent[] = [
    { name: '25m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:00' }, { name: 'Quarterfinals', startTime: '12:00' }, { name: 'Semifinals', startTime: '15:00' }, { name: 'Finals', startTime: '18:00' }] },
    { name: '25m Backstroke', rounds: [{ name: 'Prelims', startTime: '09:05' }, { name: 'Quarterfinals', startTime: '12:05' }, { name: 'Semifinals', startTime: '15:05' }, { name: 'Finals', startTime: '18:05' }] },
    { name: '25m Breaststroke', rounds: [{ name: 'Prelims', startTime: '09:10' }, { name: 'Quarterfinals', startTime: '12:10' }, { name: 'Semifinals', startTime: '15:10' }, { name: 'Finals', startTime: '18:10' }] },
    { name: '25m Butterfly', rounds: [{ name: 'Prelims', startTime: '09:15' }, { name: 'Quarterfinals', startTime: '12:15' }, { name: 'Semifinals', startTime: '15:15' }, { name: 'Finals', startTime: '18:15' }] },
    { name: '50m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:20' }, { name: 'Quarterfinals', startTime: '12:20' }, { name: 'Semifinals', startTime: '15:20' }, { name: 'Finals', startTime: '18:20' }] },
    { name: '50m Backstroke', rounds: [{ name: 'Prelims', startTime: '09:25' }, { name: 'Quarterfinals', startTime: '12:25' }, { name: 'Semifinals', startTime: '15:25' }, { name: 'Finals', startTime: '18:25' }] },
    { name: '50m Breaststroke', rounds: [{ name: 'Prelims', startTime: '10:30' }, { name: 'Quarterfinals', startTime: '13:30' }, { name: 'Semifinals', startTime: '16:30' }, { name: 'Finals', startTime: '19:30' }] },
    { name: '50m Butterfly', rounds: [{ name: 'Prelims', startTime: '09:35' }, { name: 'Quarterfinals', startTime: '12:35' }, { name: 'Semifinals', startTime: '15:35' }, { name: 'Finals', startTime: '18:35' }] },
    { name: '100m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:40' }, { name: 'Quarterfinals', startTime: '12:40' }, { name: 'Semifinals', startTime: '15:40' }, { name: 'Finals', startTime: '18:40' }] },
    { name: '100m Backstroke', rounds: [{ name: 'Prelims', startTime: '09:45' }, { name: 'Quarterfinals', startTime: '12:45' }, { name: 'Semifinals', startTime: '15:45' }, { name: 'Finals', startTime: '18:45' }] },
    { name: '100m Breaststroke', rounds: [{ name: 'Prelims', startTime: '09:50' }, { name: 'Quarterfinals', startTime: '12:50' }, { name: 'Semifinals', startTime: '15:50' }, { name: 'Finals', startTime: '18:50' }] },
    { name: '100m Butterfly', rounds: [{ name: 'Prelims', startTime: '11:00' }, { name: 'Quarterfinals', startTime: '14:00' }, { name: 'Semifinals', startTime: '16:00' }, { name: 'Finals', startTime: '19:00' }] },
    { name: '100m IM', rounds: [{ name: 'Prelims', startTime: '10:00' }, { name: 'Quarterfinals', startTime: '13:00' }, { name: 'Semifinals', startTime: '16:00' }, { name: 'Finals', startTime: '19:00' }] },
    { name: '200m Freestyle', rounds: [{ name: 'Prelims', startTime: '11:30' }, { name: 'Quarterfinals', startTime: '14:30' }, { name: 'Semifinals', startTime: '16:30' }, { name: 'Finals', startTime: '20:00' }] },
    { name: '200m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:10' }, { name: 'Quarterfinals', startTime: '13:10' }, { name: 'Semifinals', startTime: '16:10' }, { name: 'Finals', startTime: '19:10' }] },
    { name: '200m Breaststroke', rounds: [{ name: 'Prelims', startTime: '10:15' }, { name: 'Quarterfinals', startTime: '13:15' }, { name: 'Semifinals', startTime: '16:15' }, { name: 'Finals', startTime: '19:15' }] },
    { name: '200m Butterfly', rounds: [{ name: 'Prelims', startTime: '10:20' }, { name: 'Quarterfinals', startTime: '13:20' }, { name: 'Semifinals', startTime: '16:20' }, { name: 'Finals', startTime: '19:20' }] },
    { name: '200m IM', rounds: [{ name: 'Prelims', startTime: '10:25' }, { name: 'Quarterfinals', startTime: '13:25' }, { name: 'Semifinals', startTime: '16:25' }, { name: 'Finals', startTime: '19:25' }] },
    { name: '400m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:30' }, { name: 'Quarterfinals', startTime: '12:30' }, { name: 'Semifinals', startTime: '15:30' }, { name: 'Finals', startTime: '18:30' }] },
    { name: '400m IM', rounds: [{ name: 'Prelims', startTime: '10:35' }, { name: 'Quarterfinals', startTime: '13:35' }, { name: 'Semifinals', startTime: '16:35' }, { name: 'Finals', startTime: '19:35' }] },
    { name: '800m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:40' }, { name: 'Quarterfinals', startTime: '13:40' }, { name: 'Semifinals', startTime: '16:40' }, { name: 'Finals', startTime: '19:40' }] },
    { name: '1500m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:45' }, { name: 'Quarterfinals', startTime: '13:45' }, { name: 'Semifinals', startTime: '16:45' }, { name: 'Finals', startTime: '19:45' }] },
];

export const MEETS: Meet[] = [
  // Winter Meets
  {
    id: 'winter-championship-2027',
    name: 'Winter Championship',
    isChampionship: true,
    date: '2027-01-15T09:00:00Z',
    events: [
      { name: '25m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:00' }, { name: 'Quarterfinals', startTime: '12:00' }, { name: 'Semifinals', startTime: '14:00' }, { name: 'Finals', startTime: '19:00' }] },
      { name: '50m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:05' }, { name: 'Quarterfinals', startTime: '12:05' }, { name: 'Semifinals', startTime: '14:05' }, { name: 'Finals', startTime: '19:05' }] },
      { name: '100m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:15' }, { name: 'Quarterfinals', startTime: '12:15' }, { name: 'Semifinals', startTime: '14:15' }, { name: 'Finals', startTime: '19:15' }] },
      { name: '200m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:30' }, { name: 'Quarterfinals', startTime: '12:30' }, { name: 'Semifinals', startTime: '14:30' }, { name: 'Finals', startTime: '19:30' }] },
      { name: '400m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:45' }, { name: 'Quarterfinals', startTime: '12:45' }, { name: 'Semifinals', startTime: '14:45' }, { name: 'Finals', startTime: '19:45' }] },
      { name: '800m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:00' }, { name: 'Quarterfinals', startTime: '13:00' }, { name: 'Semifinals', startTime: '15:00' }, { name: 'Finals', startTime: '20:00' }] },
      { name: '1500m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:15' }, { name: 'Quarterfinals', startTime: '13:15' }, { name: 'Semifinals', startTime: '15:15' }, { name: 'Finals', startTime: '20:15' }] },
      { name: '25m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:25' }, { name: 'Quarterfinals', startTime: '13:25' }, { name: 'Semifinals', startTime: '15:25' }, { name: 'Finals', startTime: '20:25' }] },
      { name: '50m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:30' }, { name: 'Quarterfinals', startTime: '13:30' }, { name: 'Semifinals', startTime: '14:30' }, { name: 'Finals', startTime: '20:30' }] },
      { name: '100m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:45' }, { name: 'Quarterfinals', startTime: '13:45' }, { name: 'Semifinals', startTime: '14:45' }, { name: 'Finals', startTime: '20:45' }] },
      { name: '200m Backstroke', rounds: [{ name: 'Prelims', startTime: '11:00' }, { name: 'Quarterfinals', startTime: '14:00' }, { name: 'Semifinals', startTime: '15:00' }, { name: 'Finals', startTime: '21:00' }] },
      { name: '25m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:10' }, { name: 'Quarterfinals', startTime: '14:10' }, { name: 'Semifinals', startTime: '15:10' }, { name: 'Finals', startTime: '21:10' }] },
      { name: '50m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:15' }, { name: 'Quarterfinals', startTime: '14:15' }, { name: 'Semifinals', startTime: '15:15' }, { name: 'Finals', startTime: '21:15' }] },
      { name: '100m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:30' }, { name: 'Quarterfinals', startTime: '14:30' }, { name: 'Semifinals', startTime: '15:30' }, { name: 'Finals', startTime: '21:30' }] },
      { name: '200m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:45' }, { name: 'Quarterfinals', startTime: '14:45' }, { name: 'Semifinals', startTime: '15:45' }, { name: 'Finals', startTime: '21:45' }] },
      { name: '25m Butterfly', rounds: [{ name: 'Prelims', startTime: '11:55' }, { name: 'Quarterfinals', startTime: '14:55' }, { name: 'Semifinals', startTime: '15:55' }, { name: 'Finals', startTime: '21:55' }] },
      { name: '50m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:00' }, { name: 'Quarterfinals', startTime: '15:00' }, { name: 'Semifinals', startTime: '16:00' }, { name: 'Finals', startTime: '22:00' }] },
      { name: '100m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:15' }, { name: 'Quarterfinals', startTime: '15:15' }, { name: 'Semifinals', startTime: '16:15' }, { name: 'Finals', startTime: '22:15' }] },
      { name: '200m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:30' }, { name: 'Quarterfinals', startTime: '15:30' }, { name: 'Semifinals', startTime: '16:30' }, { name: 'Finals', startTime: '22:30' }] },
      { name: '100m IM', rounds: [{ name: 'Prelims', startTime: '12:45' }, { name: 'Quarterfinals', startTime: '15:45' }, { name: 'Semifinals', startTime: '16:45' }, { name: 'Finals', startTime: '22:45' }] },
      { name: '200m IM', rounds: [{ name: 'Prelims', startTime: '13:00' }, { name: 'Quarterfinals', startTime: '16:00' }, { name: 'Semifinals', startTime: '17:00' }, { name: 'Finals', startTime: '23:00' }] },
      { name: '400m IM', rounds: [{ name: 'Prelims', startTime: '13:15' }, { name: 'Quarterfinals', startTime: '16:15' }, { name: 'Semifinals', startTime: '17:15' }, { name: 'Finals', startTime: '23:15' }] }
    ],
  },
  {
    id: 'frost-challenge-2027',
    name: 'Frost Challenge',
    date: '2027-02-12T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'arctic-cup-2027',
    name: 'Arctic Cup',
    date: '2026-12-20T09:00:00Z',
    events: standardEvents,
  },
  
  // Spring Meets
  {
    id: 'spring-invitational-2027',
    name: 'Spring Invitational',
    date: '2027-04-10T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'blossom-open-2027',
    name: 'Blossom Open',
    date: '2027-05-08T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'equinox-meet-2027',
    name: 'Equinox Meet',
    date: '2027-03-20T09:00:00Z',
    events: standardEvents,
  },
  
  // Summer Meets
  {
    id: 'summer-championship-2027',
    name: 'Summer Championship',
    isChampionship: true,
    date: '2027-08-25T09:00:00Z',
    events: [
      { name: '25m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:00' }, { name: 'Quarterfinals', startTime: '12:00' }, { name: 'Semifinals', startTime: '14:00' }, { name: 'Finals', startTime: '19:00' }] },
      { name: '50m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:05' }, { name: 'Quarterfinals', startTime: '12:05' }, { name: 'Semifinals', startTime: '14:05' }, { name: 'Finals', startTime: '19:05' }] },
      { name: '100m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:15' }, { name: 'Quarterfinals', startTime: '12:15' }, { name: 'Semifinals', startTime: '14:15' }, { name: 'Finals', startTime: '19:15' }] },
      { name: '200m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:30' }, { name: 'Quarterfinals', startTime: '12:30' }, { name: 'Semifinals', startTime: '14:30' }, { name: 'Finals', startTime: '19:30' }] },
      { name: '400m Freestyle', rounds: [{ name: 'Prelims', startTime: '09:45' }, { name: 'Quarterfinals', startTime: '12:45' }, { name: 'Semifinals', startTime: '14:45' }, { name: 'Finals', startTime: '19:45' }] },
      { name: '800m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:00' }, { name: 'Quarterfinals', startTime: '13:00' }, { name: 'Semifinals', startTime: '15:00' }, { name: 'Finals', startTime: '20:00' }] },
      { name: '1500m Freestyle', rounds: [{ name: 'Prelims', startTime: '10:15' }, { name: 'Quarterfinals', startTime: '13:15' }, { name: 'Semifinals', startTime: '15:15' }, { name: 'Finals', startTime: '20:15' }] },
      { name: '25m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:25' }, { name: 'Quarterfinals', startTime: '13:25' }, { name: 'Semifinals', startTime: '15:25' }, { name: 'Finals', startTime: '20:25' }] },
      { name: '50m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:30' }, { name: 'Quarterfinals', startTime: '13:30' }, { name: 'Semifinals', startTime: '14:30' }, { name: 'Finals', startTime: '20:30' }] },
      { name: '100m Backstroke', rounds: [{ name: 'Prelims', startTime: '10:45' }, { name: 'Quarterfinals', startTime: '13:45' }, { name: 'Semifinals', startTime: '14:45' }, { name: 'Finals', startTime: '20:45' }] },
      { name: '200m Backstroke', rounds: [{ name: 'Prelims', startTime: '11:00' }, { name: 'Quarterfinals', startTime: '14:00' }, { name: 'Semifinals', startTime: '15:00' }, { name: 'Finals', startTime: '21:00' }] },
      { name: '25m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:10' }, { name: 'Quarterfinals', startTime: '14:10' }, { name: 'Semifinals', startTime: '15:10' }, { name: 'Finals', startTime: '21:10' }] },
      { name: '50m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:15' }, { name: 'Quarterfinals', startTime: '14:15' }, { name: 'Semifinals', startTime: '15:15' }, { name: 'Finals', startTime: '21:15' }] },
      { name: '100m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:30' }, { name: 'Quarterfinals', startTime: '14:30' }, { name: 'Semifinals', startTime: '15:30' }, { name: 'Finals', startTime: '21:30' }] },
      { name: '200m Breaststroke', rounds: [{ name: 'Prelims', startTime: '11:45' }, { name: 'Quarterfinals', startTime: '14:45' }, { name: 'Semifinals', startTime: '15:45' }, { name: 'Finals', startTime: '21:45' }] },
      { name: '25m Butterfly', rounds: [{ name: 'Prelims', startTime: '11:55' }, { name: 'Quarterfinals', startTime: '14:55' }, { name: 'Semifinals', startTime: '15:55' }, { name: 'Finals', startTime: '21:55' }] },
      { name: '50m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:00' }, { name: 'Quarterfinals', startTime: '15:00' }, { name: 'Semifinals', startTime: '16:00' }, { name: 'Finals', startTime: '22:00' }] },
      { name: '100m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:15' }, { name: 'Quarterfinals', startTime: '15:15' }, { name: 'Semifinals', startTime: '16:15' }, { name: 'Finals', startTime: '22:15' }] },
      { name: '200m Butterfly', rounds: [{ name: 'Prelims', startTime: '12:30' }, { name: 'Quarterfinals', startTime: '15:30' }, { name: 'Semifinals', startTime: '16:30' }, { name: 'Finals', startTime: '22:30' }] },
      { name: '100m IM', rounds: [{ name: 'Prelims', startTime: '12:45' }, { name: 'Quarterfinals', startTime: '15:45' }, { name: 'Semifinals', startTime: '16:45' }, { name: 'Finals', startTime: '22:45' }] },
      { name: '200m IM', rounds: [{ name: 'Prelims', startTime: '13:00' }, { name: 'Quarterfinals', startTime: '16:00' }, { name: 'Semifinals', startTime: '17:00' }, { name: 'Finals', startTime: '23:00' }] },
      { name: '400m IM', rounds: [{ name: 'Prelims', startTime: '13:15' }, { name: 'Quarterfinals', startTime: '16:15' }, { name: 'Semifinals', startTime: '17:15' }, { name: 'Finals', startTime: '23:15' }] }
    ]
  },
  {
    id: 'summer-splash-invitational-2027',
    name: 'Summer Splash Invitational',
    date: '2027-07-20T09:00:00Z',
    events: standardEvents,
  },
   {
    id: 'sun-tide-classic-2027',
    name: 'Sun-Tide Classic',
    date: '2027-08-18T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'solstice-swim-2027',
    name: 'Solstice Swim Fest',
    date: '2027-06-21T09:00:00Z',
    events: standardEvents,
  },

  // Fall Meets
  {
    id: 'autumn-classic-2027',
    name: 'Autumn Classic',
    date: '2027-10-05T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'harvest-moon-gala-2027',
    name: 'Harvest Moon Gala',
    date: '2027-09-22T09:00:00Z',
    events: standardEvents,
  },
  {
    id: 'october-challenge-2027',
    name: 'October Challenge',
    date: '2027-10-25T09:00:00Z',
    events: standardEvents,
  },
];
