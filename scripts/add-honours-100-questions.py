"""Add 100 original, bilingual practice questions: two to each of 50 Honours quizzes.
Run once: python3 scripts/add-honours-100-questions.py. Refuses duplicate insertion.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# slug | application question EN~BN | correct; distractor; distractor; distractor
#      | boundary/concept question EN~BN | correct; distractor; distractor; distractor
# Both questions receive individual explanations using the reviewed application
# and assumption text in add-honours-50.py. The first option is the answer.
DATA=r'''
rotational-kinetic-energy|A rotor has I=2 kg m² and ω=3 rad/s. Its K?~I=২ kg m² ও ω=৩ rad/s হলে K কত?|9 J;3 J;18 J;6 J|Which motion needs an extra kinetic-energy term beyond ½Iω² about a fixed axis?~স্থির অক্ষে ½Iω² ছাড়াও কোন গতিতে বাড়তি গতিশক্তি লাগে?|Translation of the centre of mass;Only rotation about the fixed axis;A stationary body;Zero angular speed
angular-impulse|A constant torque of 2 N m acts for 3 s. ΔL?~২ N m ধ্রুব টর্ক ৩ s কাজ করলে ΔL কত?|6 kg m²/s;2 kg m²/s;3 kg m²/s;12 kg m²/s|For a particle, about which origin does dL/dt equal torque without fictitious corrections?~কণার ক্ষেত্রে কোন মূলবিন্দুতে dL/dt সংশোধন ছাড়া টর্কের সমান?|A fixed inertial origin;Any accelerating origin;Only the centre of Earth;An origin moving in a circle
centripetal-force-honours|A 2 kg body moves at 3 m/s on a circle of radius 1 m. Radial net force?~২ kg বস্তু ১ m ব্যাসার্ধে ৩ m/s বেগে চললে অরীয় লব্ধি বল?|18 N;6 N;9 N;3 N|Centripetal force refers to what?~অভিকেন্দ্র বল বলতে কী বোঝায়?|The net inward component of actual forces;A new independent interaction;Always gravity alone;Always outward friction
gravity-potential-energy-honours|How much energy is required to move m from R to 2R around mass M?~M-এর চারপাশে m-কে R থেকে ২R-এ নিতে কত শক্তি লাগে?|GMm/(2R);GMm/R;2GMm/R;Zero|Where is potential energy defined as zero in U=−GMm/r?~U=−GMm/r-এ বিভবশক্তির শূন্য কোথায়?|At infinity;At r=R;At r=0;At 2R
orbital-speed-circular|At 4 times the radius around the same M, circular orbital speed becomes?~একই M-এর চারপাশে ৪ গুণ ব্যাসার্ধে বৃত্তীয় কক্ষপথের বেগ?|One half;One quarter;Twice;Four times|Is v=√(GM/r) applicable to arbitrary elliptical orbits at any point?~v=√(GM/r) কি যেকোনো উপবৃত্তাকার কক্ষপথের যেকোনো বিন্দুতে চলে?|No, it assumes a circular orbit;Yes, always;Only at periapsis;Only for massless satellites
shm-energy|For k=100 N/m and amplitude 0.10 m, total ideal spring energy?~k=১০০ N/m ও বিস্তার ০.১০ m হলে আদর্শ স্প্রিংয়ের মোট শক্তি?|0.50 J;5 J;1 J;50 J|When is total mechanical energy constant in this model?~এই মডেলে মোট যান্ত্রিক শক্তি কখন স্থির?|No damping and no drive;Strong viscous friction;Increasing driving force;Changing spring stiffness during motion
damped-amplitude|At t=4m/b, what fraction of initial amplitude remains?~t=৪m/b-এ প্রাথমিক বিস্তারের কত অংশ থাকে?|1/e²;1/e;1/2;e|Does the decaying oscillatory envelope apply in the overdamped regime?~অতিক্ষয়ী অবস্থায় ক্ষয়মান দোলন-আবরণ কি প্রযোজ্য?|No, there is no oscillation;Yes, with constant period;Only when b=0;Only at resonance
quality-factor-oscillator|For m=1 kg, ω₀=10 rad/s and b=0.5 kg/s, Q?~m=১ kg, ω₀=১০ rad/s ও b=০.৫ kg/s হলে Q?|20;5;2;0.05|The simple Q=mω₀/b expression is most reliable for which damping?~Q=mω₀/b সহজ সূত্রটি কোন ক্ষয়ে বেশি নির্ভরযোগ্য?|Weak linear damping;Strong nonlinear damping;Overdamped motion;Arbitrary dry friction
wave-energy-string|Increasing tension fourfold with fixed μ changes wave speed by?~μ স্থির রেখে টান ৪ গুণ করলে তরঙ্গবেগ কত গুণ?|2;4;8;1/2|Which wave is described by v=√(𝒯/μ) under the stated model?~বর্ণিত মডেলে v=√(𝒯/μ) কোন তরঙ্গে প্রযোজ্য?|Small transverse disturbance on a uniform string;Sound in a vacuum;Light in glass;A large-amplitude shock
wave-group-velocity|For dispersion ω=ck, what is dω/dk?~ω=ck হলে dω/dk কত?|c;1/c;k;0|In a strongly absorbing medium, is group velocity necessarily signal speed?~প্রবল শোষণকারী মাধ্যমে গুচ্ছবেগ কি নিশ্চিতভাবে সংকেতবেগ?|No;Yes, by definition;Only at zero frequency;Always speed of light
young-fringe-width-honours|For λ=500 nm, D=2 m, d=0.5 mm, fringe width?~λ=৫০০ nm, D=২ m ও d=০.৫ mm হলে ঝালর-প্রস্থ?|2 mm;0.2 mm;20 mm;1 mm|Which condition helps give nearly equally spaced fringes?~প্রায় সমান ব্যবধানে ঝালর পেতে কোন শর্ত সাহায্য করে?|Small angle and D much greater than d;D smaller than d;Incoherent sources;A wide range of wavelengths
single-slit-minimum-honours|For λ=500 nm and a=0.10 mm, first minimum angle approximately?~λ=৫০০ nm ও a=০.১০ mm হলে প্রথম অন্ধকারের কোণ প্রায়?|0.005 rad;0.05 rad;0.5 rad;0.00005 rad|Does m=0 in a sinθ=mλ denote a minimum?~a sinθ=mλ-এ m=০ কি অন্ধকার নির্দেশ করে?|No, it is the central maximum;Yes, the first minimum;Only for blue light;Only at θ=90°
bragg-order-limit|If 2d/λ=3.7, maximum integer Bragg order?~২d/λ=৩.৭ হলে সর্বোচ্চ পূর্ণসংখ্যা ব্র্যাগ ক্রম?|3;4;2;1|Are all geometrically allowed orders necessarily observed?~সব জ্যামিতিকভাবে অনুমোদিত ক্রম কি অবশ্যই দেখা যায়?|No, structure-factor extinction may suppress them;Yes, with equal brightness;Only even ones;Only the highest one
lensmaker-thin-honours|For R₁=R and R₂=−R, thin biconvex lens power 1/f?~R₁=R ও R₂=−R-এ পাতলা দ্বি-উত্তল লেন্সের ক্ষমতা ১/f?|2(n−1)/R;(n−1)/R;0;R/(n−1)|Which rays justify the thin-lens lensmaker relation?~পাতলা লেন্স নির্মাতার সূত্রে কোন রশ্মির অনুমান?|Paraxial rays;Only large-angle rays;Only X-rays;Any ray with no approximation
brewster-angle-honours|For air to a medium with n=1.5, Brewster angle is near?~বাতাস থেকে n=১.৫ মাধ্যমে ব্রুস্টার কোণ প্রায়?|56°;30°;90°;10°|For which interface does the elementary Brewster-angle derivation apply?~ব্রুস্টার কোণের সহজ প্রতিপাদন কোন সীমায় প্রযোজ্য?|Flat nonabsorbing dielectric interface;Arbitrary absorbing metal;Rough scattering interface;A vacuum without an interface
thin-film-phase-reversal|For λ₀=600 nm and n=1.5 at normal incidence, quarter-wave thickness?~λ₀=৬০০ nm ও n=১.৫ হলে লম্ব আপতনে চতুর্থাংশ-তরঙ্গ পুরুত্ব?|100 nm;400 nm;600 nm;50 nm|For the displayed bright-reflection condition, how many relative π phase reversals are assumed?~দেখানো প্রতিফলিত উজ্জ্বল শর্তে আপেক্ষিক π দশা-বিপর্যয় কয়টি?|One;Zero;Two;Three
adiabatic-work-ideal-gas|If PiVi=400 J, PfVf=300 J and γ=1.4, work by expanding gas?~PiVi=৪০০ J, PfVf=৩০০ J ও γ=১.৪ হলে গ্যাসের করা কাজ?|250 J;100 J;40 J;700 J|Can the reversible adiabatic work expression be used unchanged for free expansion?~প্রত্যাবর্তী অ্যাডিয়াবেটিক কাজের সূত্র কি মুক্ত প্রসারণে অপরিবর্তিত চলে?|No;Yes, always;Only when γ=1;Only at high pressure
maxwell-rms-speed-honours|If molar mass becomes four times at fixed T, v_rms becomes?~T স্থির রেখে মোলার ভর ৪ গুণ হলে v_rms?|Half;Quarter;Double;Four times|What is essential to the classical equipartition derivation?~ধ্রুপদি সমবণ্টন প্রতিপাদনের জন্য কী জরুরি?|Classical dilute equilibrium gas;Highly degenerate fermions;T=0;Strong quantum confinement
heat-engine-carnot-honours|For Th=900 K and Tc=300 K, maximum efficiency?~Th=৯০০ K ও Tc=৩০০ K হলে সর্বোচ্চ দক্ষতা?|66.7%;33.3%;50%;100%|Which temperature scale is required in Carnot's ratio?~কার্নোর অনুপাতে কোন তাপমাত্রার স্কেল নিতে হবে?|Kelvin;Celsius;Fahrenheit;Any scale without conversion
blackbody-photon-energy|If vacuum wavelength triples, photon energy becomes?~শূন্যস্থানে তরঙ্গদৈর্ঘ্য তিন গুণ হলে ফোটনশক্তি?|One third;Three times;One half;Unchanged|Can wavelength in a medium be directly substituted for vacuum λ in E=hc/λ?~E=hc/λ-এ মাধ্যমের তরঙ্গদৈর্ঘ্য সরাসরি বসানো যায়?|No, use vacuum wavelength;Yes, always;Only for ultraviolet;Only for photons at rest
relativistic-momentum-honours|For a massive particle with v≪c, γmv approaches?~ভরযুক্ত কণায় v≪c হলে γmv-এর মান?|mv;mc²;0;mv²|Does p=γmv with m=0 calculate photon momentum?~m=০ নিয়ে p=γmv কি ফোটনের ভরবেগ দেয়?|No, use p=E/c;Yes, p=0;Yes, p=mc;Only in glass
radioactive-half-life-honours|After four half-lives, fraction of radioactive nuclei left?~চার অর্ধায়ু পরে তেজস্ক্রিয় নিউক্লিয়াসের কত অংশ থাকে?|1/16;1/4;1/8;1/32|Does half-life state the certain decay time of a single nucleus?~অর্ধায়ু কি একটি নিউক্লিয়াসের নিশ্চিত ক্ষয়সময়?|No, it is statistical;Yes, exactly;Only for stable nuclei;Only at high T
cyclotron-radius-honours|For fixed p⊥ and q, triple B. What happens to radius?~p⊥ ও q স্থির রেখে B তিন গুণ করলে ব্যাসার্ধ?|One third;Triple;One half;Unchanged|With velocity partly along B, what is the trajectory in a uniform field?~সুষম ক্ষেত্রে B বরাবর বেগের অংশ থাকলে গতিপথ?|Helix;Circle in a plane only;Straight perpendicular line;Parabola
magnetic-flux-induction|For 10 turns, flux per turn drops 0.02 Wb in 1 s. Emf magnitude?~১০ পাকে প্রতি পাকের ফ্লাক্স ১ s-এ ০.০২ Wb কমলে আবিষ্ট বিভব?|0.2 V;0.02 V;2 V;20 V|What does the minus sign in Faraday's law represent?~ফ্যারাডের সূত্রে ঋণ চিহ্ন কী নির্দেশ করে?|Lenz's opposing direction;Negative energy;A negative turn count;No actual emf
inductor-energy-honours|For L=2 H and I=3 A, stored energy?~L=২ H ও I=৩ A হলে সঞ্চিত শক্তি?|9 J;3 J;18 J;6 J|When is U=½LI² with fixed L directly applicable?~স্থির L নিয়ে U=½LI² সরাসরি কখন প্রযোজ্য?|Linear unsaturated inductor;Strongly saturated magnetic core with varying L;Only a capacitor;An open wire with no inductance
rc-discharge-honours|At one time constant RC, Vc/V₀ approximately?~এক সময় ধ্রুবক RC পরে Vc/V₀ প্রায়?|0.368;0.632;0.5;1|What can invalidate ideal RC exponential decay?~আদর্শ RC সূচকীয় নিঃসরণ কোন কারণে ভুল হতে পারে?|Capacitor leakage;Constant ideal R;Constant ideal C;A high-impedance voltmeter
'''
DATA+=r'''
dalton-partial-pressure-honours|Partial pressures 45 and 25 kPa give total?~আংশিক চাপ ৪৫ ও ২৫ kPa হলে মোট চাপ?|70 kPa;20 kPa;1125 kPa;1.8 kPa|Dalton's simple additivity is exact under which gas model?~ডাল্টনের সাধারণ যোগফল কোন গ্যাস মডেলে যথার্থ?|Ideal noninteracting gas mixture;Strongly interacting dense mixture;Condensing gas;Liquid mixture
graham-effusion-honours|A gas has fourfold molar mass at equal T. Approximate effusion rate relative to light gas?~একই T-তে মোলার ভর ৪ গুণ হলে হালকা গ্যাসের তুলনায় নির্গমন হার?|One half;One quarter;Twice;Four times|Which setup matches Graham's ideal effusion model?~গ্রাহামের আদর্শ নির্গমন মডেলে কোন ব্যবস্থা মেলে?|Molecules escaping through a tiny hole;Bulk liquid flow;Turbulent gas through a wide pipe;A gas with no pressure difference
relative-vapor-pressure-lowering|An ideal nonvolatile-solute mole fraction of 0.10 gives relative vapour-pressure lowering?~আদর্শ অনুদ্বায়ী দ্রবের মোলভাগ ০.১০ হলে আপেক্ষিক বাষ্পচাপ হ্রাস?|0.10;0.90;10;1.10|Does the simple relation hold for a volatile solute without correction?~দ্রব উদ্বায়ী হলে সহজ সম্পর্কটি কি সংশোধন ছাড়া চলে?|No;Yes, always;Only at high pressure;Only when solute fraction is one
freezing-depression-electrolyte|For i=2, Kf=1.86 K kg/mol and m=0.10 mol/kg, ΔTf?~i=২, Kf=১.৮৬ K kg/mol, m=০.১০ mol/kg হলে ΔTf?|0.372 K;0.186 K;3.72 K;1.86 K|Can real NaCl always be assigned i=2 at every concentration?~বাস্তব NaCl-এ সব ঘনত্বে কি i=২ ধরা যায়?|No, interactions change effective i;Yes, without exception;Only at saturation;Only at zero kelvin
osmotic-pressure-electrolyte|At equal C and T, ideal CaCl₂ with i≈3 versus nonelectrolyte has pressure ratio?~একই C ও T-তে i≈৩ আদর্শ CaCl₂ ও অবিয়োজিত দ্রবের চাপের অনুপাত?|3:1;1:3;1:1;9:1|To obtain π in Pa using R in J/(mol K), C must be in?~R-এর একক J/(mol K) হলে π Pa পেতে C-এর একক?|mol/m³;mol/L without conversion;g/L;kg/m³
second-order-half-life|For k=0.1 L/(mol s) and [A]₀=1 mol/L, half-life?~k=০.১ L/(mol s) ও [A]₀=১ mol/L হলে অর্ধায়ু?|10 s;0.1 s;1 s;100 s|For what differential law is t½=1/(k[A]₀) derived?~t½=১/(k[A]₀) কোন অন্তরক হারসূত্র থেকে আসে?|−d[A]/dt=k[A]²;−d[A]/dt=k[A];−d[A]/dt=k;−d[A]/dt=k/[A]
pseudo-first-order-rate|If [B]₀ is doubled in r=k[A][B], apparent k′ becomes?~r=k[A][B]-এ [B]₀ দ্বিগুণ হলে আপাত k′?|Double;Half;Four times;Unchanged|Why can [B] be treated as constant?~[B]-কে স্থির ধরা যায় কেন?|B is in large excess;B is absent;A and B start equal;All rate laws are first order
reaction-quotient-gibbs|If Q=K/e, what is ΔrG?~Q=K/e হলে ΔrG কত?|−RT;0;RT;−2RT|Which Q is appropriate in ΔrG=ΔrG°+RT lnQ?~ΔrG=ΔrG°+RT lnQ-তে কেমন Q নিতে হয়?|Dimensionless activity quotient;A dimensional pressure product without standardization;Only product concentrations;Always Q=0
vanthoff-equilibrium-temperature|With positive reaction enthalpy, increasing T locally makes K?~বিক্রিয়ার এনথ্যালপি ধনাত্মক হলে T বাড়লে K সাধারণত?|Increase;Decrease;Stay zero;Become negative|For an integrated van't Hoff line, what must stay approximately constant?~সমাকলিত ভান্ট হফ রেখায় কোনটি প্রায় স্থির ধরতে হয়?|ΔrH° over the temperature interval;K under all conditions;Absolute temperature;All concentrations
kirchhoff-reaction-enthalpy|ΔCp°=10 J/(mol K) from 300 to 400 K changes ΔH° by?~৩০০ থেকে ৪০০ K-তে ΔCp°=১০ J/(mol K) হলে ΔH° কত বদলায়?|+1 kJ/mol;−1 kJ/mol;+10 kJ/mol;0|What extra contribution is needed across a phase transition?~দশা পরিবর্তনের মধ্য দিয়ে গেলে কোন অতিরিক্ত অবদান লাগে?|Latent heat;Only volume of apparatus;Only pH;No correction
acid-dissociation-ratio|If pH exceeds pKa by 1, [A−]/[HA]?~pH, pKa-এর চেয়ে ১ বেশি হলে [A−]/[HA] কত?|10;1;0.1;100|At high ionic strength, should raw concentrations replace activities without correction?~উচ্চ আয়নিক শক্তিতে সংশোধন ছাড়া সক্রিয়তার বদলে ঘনত্ব নেওয়া যায়?|No;Yes, exactly;Only for proteins;Only at pH 7
weak-acid-ph-approx|For Ka=10⁻⁵ mol/L and C=0.10 mol/L, estimated pH?~Ka=১০⁻⁵ mol/L ও C=০.১০ mol/L হলে আনুমানিক pH?|3;5;1;7|What check supports x≈√(KaC)?~x≈√(KaC) অনুমান যাচাইয়ে কী দেখবেন?|x is much less than C;Ka is larger than C;Water dominates H+;All HA fully dissociates
solubility-ab-salt|If concentration Ksp=10⁻⁸ (mol/L)² for AB in pure water, s?~AB-এর ঘনত্বভিত্তিক Ksp=১০⁻⁸ (mol/L)² হলে বিশুদ্ধ পানিতে s?|10⁻⁴ mol/L;10⁻⁸ mol/L;10⁻² mol/L;10⁴ mol/L|Which condition is needed for s=√Ksp?~s=√Ksp-এর জন্য কোন শর্ত দরকার?|No added common ion;High concentration of added A+;Strong complex formation;Significant hydrolysis
common-ion-solubility|For Ksp=10⁻⁸ (mol/L)² and common-ion c=0.01 mol/L, approximate s?~Ksp=১০⁻⁸ (mol/L)² ও সাধারণ আয়ন c=০.০১ mol/L হলে আনুমানিক s?|10⁻⁶ mol/L;10⁻⁴ mol/L;10⁻² mol/L;10⁻¹⁰ mol/L|When should the quadratic rather than s≈Ksp/c be solved?~s≈Ksp/c-এর বদলে কখন দ্বিঘাত সমাধান করবেন?|When s is not negligible relative to c;Whenever c≫s;Only for pure solids;Only at 0 K
cell-emf-from-reduction|Cathode +0.34 V and anode −0.76 V reduction potentials give E°cell?~ক্যাথোড +০.৩৪ V ও অ্যানোড −০.৭৬ V বিজারণ বিভবে E°cell?|1.10 V;−1.10 V;0.42 V;−0.42 V|Should standard electrode potentials be multiplied by balancing coefficients?~সমীকরণ সাম্য করার সহগ দিয়ে কি মান বিভব গুণ করবেন?|No;Yes, always;Only at the anode;Only when n=2
conductance-cell-constant|For G=0.01 S and cell constant 100 m⁻¹, κ?~G=০.০১ S ও কোষধ্রুবক ১০০ m⁻¹ হলে κ?|1 S/m;0.0001 S/m;100 S/m;10 S/m|How is effective cell constant best obtained for nonideal electrode geometry?~বাস্তব ইলেকট্রোড জ্যামিতিতে কার্যকর কোষধ্রুবক কীভাবে পাবেন?|Calibrate with standard electrolyte;Assume exactly zero;Read only the current;Ignore electrode placement
langmuir-half-coverage|At P=1/K, Langmuir surface coverage θ?~P=১/K হলে ল্যাংমুইর পৃষ্ঠঢাকা θ?|0.5;0;1;2|Does simple Langmuir theory include multilayer adsorption?~সরল ল্যাংমুইর তত্ত্বে কি বহুস্তর শোষণ আছে?|No, monolayer only;Yes, arbitrarily many layers;Only two layers;Only in vacuum
beer-transmittance|If transmittance fraction is 0.10, absorbance?~সঞ্চারণ ভগ্নাংশ ০.১০ হলে শোষণ A?|1;0.1;10;−1|Is T=10 a valid transmittance fraction for passive sample?~নিষ্ক্রিয় নমুনায় T=১০ কি বৈধ সঞ্চারণ ভগ্নাংশ?|No, use 0 to 1 and convert percent;Yes, 10 means 10%;Yes, because T is in kelvin;Only at pH 10
rydberg-ionization-limit|For RH≈1.097×10⁷ m⁻¹, Balmer limit is nearest?~RH≈১.০৯৭×১০⁷ m⁻¹ হলে বালমার সীমার তরঙ্গদৈর্ঘ্য প্রায়?|365 nm;121 nm;656 nm;1000 nm|Which lower hydrogen level defines Balmer transitions?~হাইড্রোজেনের কোন নিম্ন স্তরে বালমার পরিবর্তন ঘটে?|n=2;n=1;n=3;n=∞
spin-only-magnetic-moment|With three unpaired electrons, spin-only moment is about?~তিনটি অযুগ্ম ইলেকট্রনে স্পিনমাত্র মুহূর্ত প্রায়?|3.87 μB;3 μB;1 μB;0|When is spin-only approximation most suspect?~স্পিনমাত্র অনুমান কখন বেশি সন্দেহজনক?|Strong unquenched orbital contribution;Completely quenched orbital moment;Negligible spin–orbit coupling;Light first-row systems
radial-node-count|How many radial nodes in a 4d hydrogenic orbital?~হাইড্রোজেন সদৃশ 4d অরবিটালে রেডিয়াল নোড কত?|1;0;2;3|Which quantum numbers are permitted for a hydrogenic orbital?~হাইড্রোজেন সদৃশ অরবিটালে কোন কোয়ান্টাম সংখ্যা গ্রহণযোগ্য?|n≥1 and 0≤l≤n−1;l=n+1;n=0 and l=0;l negative
rotational-spectra-level|For J=2, E/(hcB) is?~J=২ হলে E/(hcB) কত?|6;2;4;3|If B is expressed in cm⁻¹, which c unit keeps hcB an energy?~B-এর একক cm⁻¹ হলে hcB শক্তি পেতে c-এর একক?|cm/s;m/s without conversion;km/h;cm²/s
vibrational-zero-point|If hν=0.20 eV, harmonic ground energy E₀?~hν=০.২০ eV হলে হারমোনিক ভূমিস্তরের শক্তি E₀?|0.10 eV;0;0.20 eV;0.40 eV|Why can a real molecular vibrational ladder deviate from equal spacing?~বাস্তব অণুর কম্পনস্তর সমান ব্যবধান থেকে কেন সরে?|Anharmonic potential;Exactly quadratic potential;Zero-point energy alone;No chemical bonds
crystal-field-octahedral-cfse|For octahedral t₂g³eg⁰, CFSE before pairing correction?~অষ্টতলক t₂g³eg⁰-এ pairing সংশোধনের আগে CFSE?|−1.2Δo;+1.2Δo;−0.4Δo;0|What must be considered separately when comparing high-spin and low-spin complexes?~উচ্চ ও নিম্ন স্পিন জটিল তুলনায় কোনটি আলাদা ধরতে হবে?|Electron-pairing energy;Only sample mass;Only atmospheric pressure;Only colour wavelength
'''

def bilingual(text):
    a,b=text.split('~',1)
    return a.strip(),b.strip()

def source_rows():
    source=(ROOT/'scripts'/'add-honours-50.py').read_text()
    return {parts[0]:parts for block in (source.split("DATA=r'''",1)[1].split("'''",1)[0],source.split("DATA+=r'''",1)[1].split("'''",1)[0]) for line in block.splitlines() if line.strip() for parts in [line.split('|')]}

if __name__=='__main__':
    source=source_rows()
    rows=[row.split('|') for row in DATA.splitlines() if row.strip()]
    assert len(rows)==50 and len({r[0] for r in rows})==50
    assert set(source)=={r[0] for r in rows},'Topics do not match the 50 source quizzes.'
    written=0
    for slug,application_q,application_options,concept_q,concept_options in rows:
        path=ROOT/'content'/'quizzes'/f'honours-{slug}.json'
        quiz=json.loads(path.read_text())
        assert len(quiz['questions'])==1,f'Not a single-question source quiz: {slug}; refusing duplicate append.'
        original=source[slug]
        assert len(original)==13
        app_en,app_bn=bilingual(original[8]);concept_en,concept_bn=bilingual(original[9])
        app_en='Use '+original[7]+'. '+app_en
        app_bn=original[7]+' ব্যবহার করুন। '+app_bn
        if slug=='reaction-quotient-gibbs':
            app_en='At Q=K/e, ΔrG=RT ln(Q/K)=−RT. '+app_en
            app_bn='Q=K/e হলে ΔrG=RT ln(Q/K)=−RT। '+app_bn
        for q_text,option_text,ex_en,ex_bn in ((application_q,application_options,app_en,app_bn),(concept_q,concept_options,concept_en,concept_bn)):
            q_en,q_bn=bilingual(q_text)
            options=option_text.split(';')
            assert len(options)==4 and len(set(options))==4,(slug,options)
            # Mathematical and technical notation is shared across languages, as on the existing quiz pages.
            quiz['questions'].append(dict(q=q_en,q_bn=q_bn,options=options,options_bn=options,answer=0,explanation=ex_en,explanation_bn=ex_bn))
            written+=1
        path.write_text(json.dumps(quiz,ensure_ascii=False,indent=2)+'\n')
    assert written==100
    print(f'Added {written} questions to 50 Honours quizzes.')
