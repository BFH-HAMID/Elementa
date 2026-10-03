"""Link physically meaningful practicals to Honours equations and label indirect coverage.
No laboratory is invented for a purely theoretical relation. Run once.
"""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]/'content'
# A related experiment is not necessarily a direct proof; the MDX note names its scope.
DIRECT={
 'angular-impulse':('rotational-kinetic-energy-lab','Observe the torque and changing angular speed of a flywheel; bearing friction must be considered.','ফ্লাইহুইলের টর্ক ও বদলানো কৌণিক বেগ মাপুন; অক্ষের ঘর্ষণ হিসাব করুন।'),
 'blackbody-photon-energy':('photoelectric-planck-honours','Stopping potential versus frequency tests the photon energy–frequency relationship, not a full blackbody spectrum.','নিবৃত্তি বিভব বনাম কম্পাঙ্কে ফোটনের শক্তি–কম্পাঙ্ক সম্পর্ক যাচাই হয়; এটি পূর্ণ কৃষ্ণবস্তু বর্ণালী নয়।'),
 'bohr-quantization-angular-momentum':('grating-spectrometer-wavelength','A hydrogen discharge spectrum provides a model-dependent check on predicted lines; grating observations do not prove Bohr orbital paths.','হাইড্রোজেন বর্ণালীর রেখা দিয়ে মডেলের পূর্বাভাস তুলনা করা যায়; গ্রেটিং পর্যবেক্ষণ বোরের কক্ষপথ সরাসরি প্রমাণ করে না।'),
 'damped-amplitude':('rigidity-torsion-pendulum','Record peak amplitudes over successive torsional cycles; the standard period measurement alone does not establish an exponential envelope.','পাক দোলনের পরপর সর্বোচ্চ বিস্তার লিখুন; শুধু পর্যায়কাল মাপলে সূচকীয় ক্ষয় প্রমাণ হয় না।'),
 'fourier-heat-conduction':('lees-disc-conductivity','Lee’s disc uses steady heat flow through a thin sheet to estimate thermal conductivity with cooling corrections.','লির চাকতিতে পাতলা পাতের স্থির তাপপ্রবাহ ও শীতলন সংশোধনে তাপ-পরিবাহিতা নির্ণয় হয়।'),
 'hydrogen-energy-levels-bohr':('grating-spectrometer-wavelength','With a hydrogen discharge source, compare measured lines with energy-level differences; the ordinary lamp in the guide must be replaced.','হাইড্রোজেন discharge আলোয় রেখা ও শক্তিস্তরের পার্থক্য তুলনা করুন; গাইডের সাধারণ বাতির বদলে ওই উৎস লাগবে।'),
 'inductor-energy-honours':('lcr-series-resonance-lab','Measure L and the AC current to estimate instantaneous LI²/2; resonance itself tests reactance, not energy storage directly.','L ও AC প্রবাহ মেপে ক্ষণিক LI²/২ নির্ণয় করুন; অনুনাদ সরাসরি সঞ্চিত শক্তি নয়, প্রতিঘাত যাচাই করে।'),
 'lensmaker-thin-honours':('lens-focal-length','Measure focal length for lenses of known curvature; the basic lens practical alone does not measure surface radii.','জানা বক্রতার লেন্সের ফোকাস দৈর্ঘ্য মাপুন; সাধারণ লেন্স পরীক্ষায় পৃষ্ঠের বক্রতার ব্যাসার্ধ আলাদা মাপা হয় না।'),
 'magnetic-flux-induction':('transformer-characteristics-lab','Alternating magnetic flux induces transformer secondary emf; compare winding ratios under safe low-voltage AC.','পরিবর্তনশীল চৌম্বক ফ্লাক্সে ট্রান্সফরমারের সেকেন্ডারিতে বিভব আসে; নিরাপদ কম AC-তে পাক-অনুপাত তুলুন।'),
 'quality-factor-oscillator':('lcr-series-resonance-lab','Determine electrical Q from resonance frequency divided by bandwidth; this is analogous to mechanical oscillator damping.','অনুনাদ কম্পাঙ্ক/ব্যান্ডউইডথ থেকে বৈদ্যুতিক Q নিন; এটি যান্ত্রিক দোলকের ক্ষয়ের অনুরূপ।'),
 'shm-energy':('mass-spring-shm','Measure spring extension and period for a near-ideal oscillator; friction makes measured mechanical energy decrease.','প্রায় আদর্শ স্প্রিং দোলকে প্রসারণ ও পর্যায়কাল মাপুন; ঘর্ষণে মাপা যান্ত্রিক শক্তি কমে।'),
 'thin-film-phase-reversal':('newtons-rings-radius','Reflected Newton rings arise from an air film of varying thickness; determine dark rings using the reflection phase reversal.','বিভিন্ন পুরুত্বের বায়ুস্তরে প্রতিফলনে নিউটনের বলয় হয়; প্রতিফলনের দশা-বিপর্যয় ধরে অন্ধকার বলয় নির্ণয় করুন।'),
 'young-fringe-width-honours':('young-double-slit-lab','Measure fringe widths over several screen distances and compare β=λD/d within small-angle limits.','কয়েকটি পর্দা দূরত্বে ঝালরের প্রস্থ মেপে ক্ষুদ্র-কোণ শর্তে β=λD/d তুলনা করুন।'),
 'acid-dissociation-ratio':('weak-acid-ph-approx-lab','Use a calibrated pH meter on dilute solutions; concentration ratios need a mass balance or buffer composition, not pH alone.','বিরল দ্রবণে ক্রমাঙ্কিত pH মিটার নিন; শুধু pH নয়, ঘনত্ব অনুপাতের জন্য ভর-সাম্য বা বাফার গঠন চাই।'),
 'cell-emf-from-reduction':('nernst-cell-concentration','Measure emf with a reference electrode; a concentration cell alone checks potential differences but not absolute standard electrode values.','তুলনামূলক ইলেকট্রোডে বিভব মাপুন; শুধু ঘনত্ব কোষ বিভব-পার্থক্য যাচাই করে, পরম মান বিভব নয়।'),
 'debye-huckel-limiting-law':('conductance-cell-constant-lab','Conductivity measurements can probe dilute ionic solutions, but cannot by themselves determine individual activity coefficients.','পরিবাহিতা মেপে বিরল আয়নিক দ্রবণ দেখা যায়, কিন্তু শুধু তা দিয়ে পৃথক সক্রিয়তা সহগ বের হয় না।'),
 'equilibrium-constant':('iron-thiocyanate-equilibrium-lab','Spectrophotometric FeSCN²⁺ concentration and mass balance yield a conditional concentration equilibrium constant.','FeSCN²⁺-এর শোষণ ও ভর-সাম্যে শর্তাধীন ঘনত্বভিত্তিক সাম্য ধ্রুবক মেলে।'),
 'eyring-transition-state-equation':('ester-hydrolysis-kinetics','Measure rate constants at several controlled temperatures; a single-temperature ester run does not establish activation parameters.','কয়েকটি নিয়ন্ত্রিত তাপে হারধ্রুবক মাপুন; এক তাপমাত্রার এস্টার পরীক্ষা সক্রিয়ণ পরামিতি স্থির করে না।'),
 'gibbs-phase-rule':('freezing-depression-electrolyte-lab','A cooling plateau demonstrates phase coexistence, but a full phase-rule test needs controlled independent variables and phase counts.','শীতলনের স্থির অংশে দশার সহাবস্থান দেখা যায়; পূর্ণ দশা সূত্র যাচাইয়ে স্বাধীন চলক ও দশা-সংখ্যা লাগবে।'),
 'langmuir-adsorption-isotherm':('charcoal-acetic-adsorption','Measure equilibrium uptake across concentrations; Langmuir fitting requires independent evidence for monolayer and identical sites.','বিভিন্ন ঘনত্বে সাম্য শোষণ মাপুন; Langmuir মডেলে একস্তর ও সমান আসনের পৃথক প্রমাণ দরকার।'),
 'langmuir-half-coverage':('charcoal-acetic-adsorption','Estimate half-coverage only after a Langmuir fit; the charcoal practical alone was designed for an empirical Freundlich fit.','Langmuir রেখা বসানোর পরেই অর্ধঢাকা নির্ণয়; কয়লার পরীক্ষাটি মূলত Freundlich রূপে সাজানো।'),
 'nernst-distribution-law':('liquid-partition-coefficient','Measure both phases at equilibrium and check whether the same molecular species is being compared.','সাম্যে দুই স্তরের ঘনত্ব মেপে একই আণবিক রূপ তুলনা হচ্ছে কি না দেখুন।'),
 'pseudo-first-order-rate':('ester-hydrolysis-kinetics','Excess water makes ester hydrolysis approximately pseudo-first-order; test a linear integrated-rate plot.','অতিরিক্ত পানিতে এস্টার হাইড্রোলাইসিস আনুমানিক ছদ্ম প্রথম-ক্রম; সমাকলিত হার রেখা যাচাই করুন।'),
 'reaction-quotient-gibbs':('iron-thiocyanate-equilibrium-lab','Measure a conditional K from equilibrium compositions; transient reaction quotient Q requires non-equilibrium samples.','সাম্য গঠনে শর্তাধীন K মাপা যায়; সাম্যের বাইরের Q পেতে অসম্য নমুনা লাগবে।'),
 'rydberg-equation-hydrogen':('grating-spectrometer-wavelength','Use a hydrogen spectral discharge lamp to measure Balmer wavelengths; ordinary spectral lamps show other elements.','বালমার তরঙ্গদৈর্ঘ্যে হাইড্রোজেন discharge বাতি নিন; সাধারণ বর্ণালী বাতিতে অন্য মৌলের রেখা থাকে।'),
 'rydberg-ionization-limit':('grating-spectrometer-wavelength','Measure several hydrogen Balmer lines and extrapolate toward the series limit; a single observed line is not the limit.','কয়েকটি হাইড্রোজেন বালমার রেখা মেপে শ্রেণিসীমার দিকে extrapolate করুন; এক রেখাই সীমা নয়।'),
 'second-order-half-life':('iodine-clock-rate-law','Vary initial concentration and use rate data to test reaction order; the iodine clock is not automatically second-order.','প্রাথমিক ঘনত্ব বদলে হার থেকে ক্রম যাচাই করুন; আয়োডিন ঘড়ি স্বয়ংক্রিয়ভাবে দ্বিতীয়-ক্রম নয়।'),
 'vanthoff-equilibrium-temperature':('iron-thiocyanate-equilibrium-lab','Repeat conditional equilibrium measurements at several temperatures; the present lab uses one T by default.','কয়েকটি তাপে সাম্যের পাঠ নিন; বর্তমান ল্যাবের সাধারণ পদ্ধতিতে একটি T রাখা হয়।'),
}
# Each purely theoretical item is explicitly labelled as an observational connection, not a fictional lab.
NO_DIRECT={
 'bragg-equation':('An X-ray diffractometer and a known crystal standard are needed for a direct Bragg-spacing measurement.','সরাসরি ব্র্যাগ ব্যবধান মাপতে এক্স-রে ডিফ্র্যাকটোমিটার ও জানা স্ফটিক মান প্রয়োজন।'),
 'bragg-order-limit':('A crystal X-ray diffractometer can test the geometric order limit, but missing peaks may also reflect structure-factor extinction.','স্ফটিকের এক্স-রে ডিফ্র্যাকটোমিটারে ক্রমের জ্যামিতিক সীমা দেখা যায়, তবে অনুপস্থিত রেখা গঠনগত বিলুপ্তিতেও হতে পারে।'),
 'compton-effect-wavelength-shift':('Direct wavelength-shift measurement requires a shielded high-energy scattering spectrometer, not an unsupervised teaching bench.','সরাসরি তরঙ্গদৈর্ঘ্য পরিবর্তনে সুরক্ষিত উচ্চ-শক্তির বিচ্ছুরণ বর্ণালিবীক্ষক লাগে, সাধারণ বেঞ্চে নয়।'),
 'coriolis-force':('A rotating-platform trajectory can show a frame-dependent sideways deflection; a stationary bench cannot isolate this pseudo-force.','ঘূর্ণায়মান মঞ্চে গতিপথের পার্শ্ববিচ্যুতি দেখা যায়; স্থির বেঞ্চে ছদ্মবল আলাদা করা যায় না।'),
 'cyclotron-radius-honours':('A charged-particle beam in a calibrated uniform magnetic field is required to test orbit radius; a Hall sensor alone is not a cyclotron orbit.','কক্ষব্যাসার্ধ যাচাইয়ে সমান চৌম্বক ক্ষেত্রে চার্জিত কণার রশ্মি চাই; হল সেন্সর সাইক্লোট্রন কক্ষপথ নয়।'),
 'fermi-dirac-occupation':('Occupation statistics are inferred from calibrated electronic or spectroscopic measurements; a classroom voltmeter cannot count single-state occupancies.','ক্রমাঙ্কিত বৈদ্যুতিক বা বর্ণালী পরিমাপ থেকে দখল-পরিসংখ্যান অনুমান হয়; সাধারণ ভোল্টমিটারে একক অবস্থার দখল গোনা যায় না।'),
 'heisenberg-uncertainty-principle':('Single-slit diffraction qualitatively connects aperture width and momentum spread; it is not a direct simultaneous x–p measurement.','একক চিরে চিরের প্রস্থ ও ভরবেগের বিস্তার গুণগতভাবে যুক্ত; এটি x–p যুগপৎ মাপা নয়।'),
 'particle-in-box-energy':('Semiconductor quantum-well spectroscopy can test confinement scaling, but its actual potentials are not ideal infinite square wells.','অর্ধপরিবাহী quantum well-এর বর্ণালীতে confinement-এর প্রবণতা মেলে, তবে বাস্তব বিভব অসীম বর্গাকার কূপ নয়।'),
 'radioactive-half-life-honours':('A shielded Geiger-counter decay series under radiation-safety supervision can estimate half-life; no such direct lab is currently included.','বিকিরণ নিরাপত্তায় সুরক্ষিত গাইগার গণকে ক্ষয়ের পাঠে অর্ধায়ু পাওয়া যায়; এ ধরনের সরাসরি ল্যাব এখনও নেই।'),
 'relativistic-length-contraction':('Particle-beam lifetime observations test Lorentz kinematics indirectly; ruler measurements of lab-scale objects cannot reach useful speeds.','কণা রশ্মির আয়ু পর্যবেক্ষণে লরেঞ্জ গতিবিদ্যা পরোক্ষে দেখা যায়; সাধারণ বস্তুতে স্কেল দিয়ে উপযুক্ত বেগ পাওয়া যায় না।'),
 'relativistic-time-dilation':('High-speed particle decay or precision clocks test time dilation; a classroom pendulum is not a direct relativistic test.','দ্রুত কণার ক্ষয় বা নির্ভুল ঘড়িতে সময় প্রসারণ দেখা যায়; শ্রেণিকক্ষের দোলক সরাসরি আপেক্ষিক পরীক্ষা নয়।'),
 'relativistic-momentum-honours':('Beam bending in a calibrated magnetic field can infer relativistic p; a low-speed mechanics track tests only p≈mv.','ক্রমাঙ্কিত চৌম্বক ক্ষেত্রে রশ্মির বাঁকে আপেক্ষিক p পাওয়া যায়; কম বেগের ট্র্যাকে শুধু p≈mv দেখা যায়।'),
 'schrodinger-equation':('Spectral line energies test predictions for a specified potential and boundary conditions, not the equation without a model.','নির্দিষ্ট বিভব ও সীমানা-শর্তের বর্ণালীর শক্তিস্তর দিয়ে পূর্বাভাস যাচাই হয়; মডেল ছাড়া সমীকরণ একা নয়।'),
 'bond-order-molecular-orbitals':('Bond lengths or dissociation energies provide indirect evidence, but bond order itself is a model-dependent electron count.','বন্ধনের দৈর্ঘ্য বা বিচ্ছেদশক্তি পরোক্ষ তথ্য দেয়; বন্ধনক্রম মডেলনির্ভর ইলেকট্রন গণনা।'),
 'crystal-field-octahedral-cfse':('UV–visible absorption and magnetic susceptibility of matched complexes probe Δo and spin state; no dedicated instrument guide is included.','উপযুক্ত জটিলে UV–visible শোষণ ও চৌম্বক susceptibility দিয়ে Δo ও স্পিন অবস্থা বোঝা যায়; নির্দিষ্ট যন্ত্রের গাইড এখনও নেই।'),
 'cubic-interplanar-spacing':('X-ray powder diffraction peak positions and known wavelength provide d; optical gratings do not measure atomic crystal planes.','এক্স-রে গুঁড়া অপবর্তনে রেখার অবস্থান ও জানা তরঙ্গদৈর্ঘ্যে d মেলে; আলোক গ্রেটিংয়ে পরমাণু তল মাপা যায় না।'),
 'faradays-law':('Electrolytic plating with weighed electrodes and measured charge could test deposited mass; follow metal-waste safety rules.','ইলেকট্রোডের ভর ও মোট চার্জ মেপে তড়িৎ প্রলেপে সঞ্চিত ভর যাচাই করা যায়; ধাতব বর্জ্যবিধি মানুন।'),
 'michaelis-menten-equation':('An enzyme-rate series versus substrate concentration is required; chemical ester hydrolysis without an enzyme does not verify Michaelis–Menten kinetics.','বিভিন্ন সাবস্ট্রেট ঘনত্বে এনজাইমের হার মাপতে হবে; এনজাইম ছাড়া এস্টার হাইড্রোলাইসিসে Michaelis–Menten যাচাই হয় না।'),
 'radial-node-count':('Photoelectron spectra probe orbital structure indirectly; hydrogenic radial nodes are predicted by the wavefunction, not directly counted in a basic lab.','ফটোইলেকট্রন বর্ণালীতে অরবিটালের পরোক্ষ তথ্য মেলে; সাধারণ ল্যাবে হাইড্রোজেন সদৃশ রেডিয়াল নোড সরাসরি গোনা যায় না।'),
 'rotational-spectra-level':('Microwave rotational spectroscopy measures line separations; an optical spectrometer is not a substitute for microwave transitions.','মাইক্রোওয়েভ ঘূর্ণন বর্ণালীতে রেখার ব্যবধান মাপা যায়; আলোক বর্ণালিবীক্ষক তার বিকল্প নয়।'),
 'spin-only-magnetic-moment':('A calibrated magnetic-susceptibility balance can test effective moment; coloured flame observations cannot determine unpaired spin count.','ক্রমাঙ্কিত চৌম্বক susceptibility-তে কার্যকর মুহূর্ত মেলে; রঙিন শিখা থেকে অযুগ্ম স্পিন গণনা হয় না।'),
 'vibrational-zero-point':('Infrared vibrational spectroscopy tests level differences; absolute zero-point energy requires a model and cannot be read from one absorption line.','IR কম্পন বর্ণালীতে স্তরের পার্থক্য মেলে; শূন্য-বিন্দু শক্তি মডেল ছাড়া এক রেখায় সরাসরি পড়া যায় না।'),
}
# Use a clear, truthful generic boundary for other theoretical entries not assigned a lab.
for subject in ('physics','chemistry'):
    for path in sorted((ROOT/subject/'honours').glob('*.mdx')):
        raw=path.read_text()
        front,body=raw.split('---\n',2)[1:]
        if not __import__('re').search(r'^type: ["\']?equation',front,__import__('re').M):
            continue
        slug=path.stem
        if slug in DIRECT and '\nexperiment:' not in front:
            lab,en,bn=DIRECT[slug]
            assert list(ROOT.glob(f'*/**/{lab}.mdx')),lab
            front+='experiment: "'+lab+'"\n'
        elif slug in DIRECT:
            _,en,bn=DIRECT[slug]
        elif slug in NO_DIRECT:
            en,bn=NO_DIRECT[slug]
        elif '\nexperiment:' in front:
            en='The linked guide supplies an observable or model check; its assumptions and measurement uncertainty must be reviewed before claiming verification.'
            bn='সংযুক্ত ল্যাবে পর্যবেক্ষণ বা মডেল তুলনা আছে; যাচাই দাবি করার আগে তার শর্ত ও পরিমাপ-অনিশ্চয়তা দেখুন।'
        else:
            en='No direct lab for this theoretical relation is supplied. Apply the stated assumptions to a worked calculation and compare measurable predictions only when the appropriate apparatus is available.'
            bn='এই তাত্ত্বিক সম্পর্কের সরাসরি ল্যাব এখানে নেই। শর্ত মেনে উদাহরণ হিসাব করুন; উপযুক্ত যন্ত্র থাকলেই মাপযোগ্য পূর্বাভাস তুলনা করুন।'
        if '### Experimental context / পরীক্ষাগত সংযোগ' not in body:
            body+='\n### Experimental context / পরীক্ষাগত সংযোগ\n\n'+en+'\n\n'+bn+'\n'
            path.write_text('---\n'+front+'---\n'+body)
print('Added honest experimental context to all Honours equation pages.')
