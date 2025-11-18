import { filterUsersWithFines } from '../utils';

describe('filterUsersWithFines', () => {
  it('mengembalikan hanya pengguna dengan denda lebih dari 0', () => {
    const users = [
      { fine_balance: 100 },
      { fine_balance: 0 },
      { fine_balance: null },
      { fine_balance: -10 },
      { fine_balance: 50 }
    ];
    const result = filterUsersWithFines(users);
    expect(result).toEqual([
      { fine_balance: 100 },
      { fine_balance: 50 }
    ]);
  });

  it('mengembalikan array kosong jika tidak ada pengguna yang memiliki denda', () => {
    const users = [
      { fine_balance: 0 },
      { fine_balance: null },
      { fine_balance: -5 }
    ];
    expect(filterUsersWithFines(users)).toEqual([]);
  });
});
