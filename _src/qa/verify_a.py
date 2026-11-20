"""A csoport (C01–C04) laborjainak független újraszámolása – a widgetek kódjától külön megírt modellekkel.
Futtatás: python3 _src/qa/verify_a.py  → a kiírt számokat az élő laborok kijelzőivel kell összevetni (labs_a.py info.json)."""
import math
print('— 1.3 döntés-widget (alapérték): D=9 m, 8 szint, pince nélkül')
q = 12 * 8; qnet = q - 19 * 1.5; Hs = 9 - 1.5
print('  q =', q, 'kPa · s =', round(1000 * 0.75 * qnet * Hs / 3500 + 10 * min(1, q / 150)), 'mm · R =', round((5.14 * 25 + 19 * 1.5) / 1.4), 'kPa')
print('— 2.1 teherátadás (A profil, zg=10, L=13, D=0,6)')
Rs = math.pi * 0.6 * (15 * 10 + 90 * 3); Rb = math.pi * 0.36 / 4 * 6000
print('  Rs =', round(Rs), 'Rb =', round(Rb), 'talp', round(100 * Rb / (Rs + Rb)), '%')
print('— 2.2 cölöpcsoport (szél: N=3000, H=600, h=25)')
X = [-3.75, -1.25, 1.25, 3.75]; S2 = sum(x * x for x in X); M = 600 * 25
print('  P =', [round(3000 / 4 + M * x / S2) for x in X], 'M =', M, 'H/4 =', 150)
print('— 3.3 verés: s = E/R − c/2 rétegenként integrálva, E = η·m·g·h')
LAY = {'puha': (15, 300), 'lhomok': (20, 1500), 'thomok': (60, 15000), 'cement': (120, 80000), 'feltolt': (18, 1200), 'tomb': (60, 90000), 'kavics': (70, 18000), 'kozet': (100, None)}
PR = {'A': [('puha', 7), ('thomok', 14)], 'B': [('lhomok', 3.5), ('cement', 4.0), ('thomok', 14)], 'C': [('feltolt', 1.6), ('tomb', 2.2), ('feltolt', 3.2), ('puha', 6), ('kavics', 14)], 'D': [('puha', 6.5), ('kozet', 14)]}
PILES = {'vb30': (10, 1.2, 0.09), 'vb40': (10, 1.6, 0.16), 'H': (12, 1.2, 0.02)}
def res(prof, per, A, z):
    Rs = 0; top = 0; lt = None
    for k, bot in PR[prof]:
        Rs += LAY[k][0] * per * max(0, min(z, bot) - top)
        if lt is None and top - 1e-9 <= z < bot: lt = (k, top)
        top = bot
    if lt is None: lt = (PR[prof][-1][0], 0)
    qb = LAY[lt[0]][1]
    return (None if qb is None else Rs + qb * A), lt
def drive(prof, pile, E):
    L, per, A = PILES[pile]; z = 0; n = 0; sets = []; zmax = L - 0.5
    while n < 20000:
        R0, lt0 = res(prof, per, A, z + 1e-6); s = 0; Er = 0 if R0 is None else E - R0 * 0.003
        while Er > 0 and s < 0.4 and z + s < zmax - 1e-9:
            R, lt = res(prof, per, A, z + s + 0.001)
            if R is None: s = max(s, lt[1] - z); break
            need = R * 0.002
            if need >= Er: s += 0.002 * Er / need; Er = 0; break
            Er -= need; s += 0.002
        s = min(s, zmax - z); z += s; n += 1; sets.append(s)
        R1, lt1 = res(prof, per, A, z + 1e-6)
        if z >= zmax - 1e-6: return 'elérte', n, round(z, 2), round(R1)
        if n >= 10 and sum(sets[-10:]) < 0.01: return ('kőzet' if R1 is None else 'elakadt: ' + lt1[0]), n, round(z, 2), None if R1 is None else round(R1)
E = 0.85 * 4 * 9.81 * 0.8
print('  E =', round(E, 1), 'kJ')
for pr in 'ABCD':
    for pl in PILES: print('  ', pr, pl, drive(pr, pl, E))
print('— 3.5 rezgés: v = v10·(10/r)^n; vert, 30 kJ, 8 m, lakóház')
v = 12 * (10 / 8) ** 1.1; print('  v =', round(v, 1), 'mm/s ·', round(100 * v / 5), '% · r_min =', round(10 * (12 / 5) ** (1 / 1.1), 1), 'm')
print('— 4.2 Franki-hagyma: V = 0,075 + n·0,12; D = (6V/π)^(1/3)')
for n in (1, 5, 8):
    V = 0.075 + n * 0.12; D = (6 * V / math.pi) ** (1 / 3); A = math.pi * D * D / 4
    print('  n =', n, 'V =', round(V, 3), 'D =', round(D, 2), 'A =', round(A, 2), 'arány =', round(A / (math.pi * 0.36 / 4), 1))
print('— 4.3 csavart: T = 22·(D/450)²·q·k·(1 + 0,45·z), határ 400 kNm; elakadás mélysége (m)')
for S, q in (('laza', 1), ('közepes', 1.5), ('agyag', 1.2), ('tömör', 9)):
    for Hn, k in (('sima', 1), ('menetes', 1.1), ('FDP', 1.2)):
        print('  ', S, Hn, [(D, round((400 / (22 * (D / 450) ** 2 * q * k) - 1) / 0.45, 1)) for D in (300, 450, 600)])
V = math.pi / 4 * 0.45 ** 2 * 14; print('  V(450 mm, 14 m) =', round(V, 2), 'm³ · furadék', round(V * 1.25, 1), 'm³ · 100 cölöp:', math.ceil(V * 1.25 * 10), 'teherautó')
