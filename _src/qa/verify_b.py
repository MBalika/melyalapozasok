# C05–C08 (fúrt, egyéb, résfal, kút) laborjainak és számpéldáinak független újraszámolása – futtatás: python3 _src/qa/verify_b.py
from math import *
# 1) nyomásábra példa (C07): homok φ=32°, γ=18/γ'=10, h=2, t=0,5, γb=10,8, L=5,6, D=20
phi=radians(32); Ka=tan(pi/4-phi/2)**2; s2=sin(2*phi); L=5.6
def schnee(layers):  # [(vastagság, γ)], zárt alak rétegenként
    u=0
    for dz,g in layers:
        uinf=L*g*Ka/s2; u=uinf+(u-uinf)*exp(-dz*s2/L)
    return u
sp=(20-0.5)*10.8; sv=(20-2)*10; sx=schnee([(2,18),(18,10)]); sR=Ka*(2*18+18*10)
print('press: σp=%.1f  σv+σx=%.1f  Rankine=%.1f  (Ka=%.4f)'%(sp,sv+sx,sv+sR,Ka))
print('  ρ=1,10-zel σp=%.1f'%((20-0.5)*11))
# 2) silóhatás: L=5,6, γ'=10, 30 m
print('silo30: σx=%.1f Rankine=%.1f hat=%.1f csökk=%.0f%%'%(schnee([(30,10)]),Ka*300,L*10*Ka/s2,100*(1-schnee([(30,10)])/(Ka*300))))
# 3) résállékonyság-labor alap: γ=18, γsat=20, h=2, t=0,3, ρ=1,08, L=5,6, D=25
best=(9,0); bestR=(9,0)
z=1.2
while z<=25+1e-9:
    lay=[(min(z,2),18)]+([(z-2,10)] if z>2 else [])
    ex=(z-0.3)*10.8-max(0,z-2)*10
    e=ex/schnee(lay); eR=ex/(Ka*(min(z,2)*18+max(0,z-2)*10))
    if e<best[0]: best=(e,z)
    if eR<bestR[0]: bestR=(eR,z)
    z+=0.05
print('lab: ηmin=%.2f @%.1f m ; Rankine ηmin=%.2f @%.1f m ; talp σx=%.0f/%.0f'%(best+bestR+(schnee([(2,18),(23,10)]),Ka*(36+230))))
# 4) furatlabor zagy-túlnyomás: z=14, hw=3, sz=1,5
print('furat zagy: Δp=%.1f kPa'%(11*(14-1.5)-10*(14-3)))
# 5) CFA-monitor: D=60, v=1,5 m/perc, p=5 bar -> Q=0,5 m3/perc
A=pi*0.6**2/4; print('CFA: A=%.4f r=%.0f%% Q=%.0f m3/h Vth(14m)=%.2f'%(A,100*0.5/(1.5*A),30,A*14))
# 6) kihajlás: Ø30/11 + cementtest D=100, cu=8
EIs=210e6*pi/64*(0.030**4-0.011**4); Ig=pi/64*(0.10**4-0.03**4)+pi/64*0.011**4; EI=EIs+1e7*Ig; k=67*8
print('kihajlás: EIs=%.1f EI=%.1f Ncr=%.0f kN ; Npl(Titan30/11)=260'%(EIs,EI,2*sqrt(k*EI)))
EI40=210e6*pi/64*(0.040**4-0.016**4); EIc=210e6*pi/64*(0.1143**4-0.0963**4); Ac=pi/4*(0.1143**2-0.0963**2)
print('  EIs 40/16=%.1f ; cső 114,3x9: EI=%.0f, Npl=%.0f kN (S355)'%(EI40,EIc,Ac*355e3))
lam=(EI/(67*30))**0.25; print('  cu=30, Lf=1,5: Ncr=%.0f'%(pi**2*EI/(1.5+pi*lam/sqrt(2))**2))
# 7) kútsüllyesztő alap: D=2, v=0,3, L=6, homok f=12, qe=400, alákotrás
Aw=pi/4*(4-1.4**2); G=25*Aw*6.5; U=10*Aw*4.5; S=12*pi*2*6; Re=400*0.25*pi*2*0.15
zs=(G+10*Aw*1.5-Re)/(12*pi*2+10*Aw)
print('kút: G=%.0f U=%.0f S+Rv=%.0f elakad=%.1f m ballaszt=%.0f'%(G,U,S+Re,zs,S+Re-(G-U)))
# 8) keszon: h=18 m
print('keszon: p=%.2f bar ; 1 bar=%.2f m ; 3,2–3,5 bar = %.1f–%.1f m'%(9.81*18/100,100/9.81,320/9.81,350/9.81))
# 9) jet: homok, szimpla, 450 bar, 30 cm/perc, s=0,6
f=0.25*(0.55+0.45*0.5)*(0.8+0.4*0.6); D=0.6+1.0*f; print('jet: D=%.2f t=%.2f dz=%.1f cm n=%d'%(D,2*sqrt((D/2)**2-0.09),30/12,ceil(10/0.6)+1))
