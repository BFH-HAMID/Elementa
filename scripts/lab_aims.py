"""Specific aims for the fifty generated lab guides.

`scripts/add-honours-50-labs.py` wrote the same sentence into every guide it
created — "Determine or verify: <title>. Record observations and compare against
the stated model." — which tells a student nothing about what the experiment
actually measures. Each aim here names the measured quantity, the method and the
comparison that the guide's own calculation section asks for, so the Aim tab, the
header paragraph and the first key point all say something useful.

The English and Bangla strings are parallel; maths stays in `$…$` so `MathText`
renders it with KaTeX in both locales.
"""

AIMS = {
    'charcoal-acetic-adsorption': {
        'en': 'Find how much acetic acid charcoal adsorbs at different equilibrium concentrations and test the Freundlich isotherm from the slope of $\\ln(x/m)$ against $\\ln C_e$.',
        'bn': 'বিভিন্ন সাম্যাবস্থা ঘনমাত্রায় কাঠকয়লা কতটা অ্যাসিটিক অ্যাসিড শোষণ করে তা বের করা এবং $\\ln(x/m)$ বনাম $\\ln C_e$-এর ঢাল থেকে ফ্রয়ন্ডলিখ আইসোথার্ম যাচাই।',
    },
    'conductometric-acid-base': {
        'en': 'Follow a strong acid–strong base titration by conductance, locate the equivalence volume where the two limbs meet and calculate the acid concentration.',
        'bn': 'পরিবাহিতা মেপে শক্ত অম্ল-ক্ষার টাইট্রেশন অনুসরণ, দুই অংশের মিলনবিন্দু থেকে তুল্যতা আয়তন নির্ণয় এবং অ্যাসিডের ঘনমাত্রা হিসাব।',
    },
    'copper-iodometry': {
        'en': 'Estimate copper(II) in a sample by liberating iodine with excess potassium iodide and titrating it with standard sodium thiosulfate.',
        'bn': 'অতিরিক্ত পটাশিয়াম আয়োডাইড দিয়ে আয়োডিন মুক্ত করে আদর্শ সোডিয়াম থায়োসালফেটে টাইট্রেশনের মাধ্যমে নমুনায় কপার(II)-এর পরিমাণ নির্ণয়।',
    },
    'dichromate-ferrous-titration': {
        'en': 'Determine ferrous iron in a solution by titrating it against standard potassium dichromate with a suitable indicator.',
        'bn': 'উপযুক্ত নির্দেশক ব্যবহার করে আদর্শ পটাশিয়াম ডাইক্রোমেটের বিরুদ্ধে টাইট্রেশনে দ্রবণের ফেরাস লোহা নির্ণয়।',
    },
    'dissolved-oxygen-winkler': {
        'en': 'Measure the dissolved oxygen of a water sample by Winkler iodometry and express it in $\\mathrm{mg/L}$, correcting for the reagent volume displaced.',
        'bn': 'উইংকলার আয়োডোমেট্রি পদ্ধতিতে পানির নমুনার দ্রবীভূত অক্সিজেন মেপে তা $\\mathrm{mg/L}$-এ প্রকাশ, এবং বিকারকে সরানো আয়তনের সংশোধনসহ।',
    },
    'double-indicator-carbonate': {
        'en': 'Analyse a mixture of sodium hydroxide and sodium carbonate by double-indicator titration with standard acid.',
        'bn': 'আদর্শ অ্যাসিড দিয়ে দ্বি-নির্দেশক টাইট্রেশনে সোডিয়াম হাইড্রক্সাইড ও সোডিয়াম কার্বোনেটের মিশ্রণ বিশ্লেষণ।',
    },
    'ester-hydrolysis-kinetics': {
        'en': 'Follow acid-catalysed ester hydrolysis by titrating the acid present at intervals and test for first-order behaviour from the slope of $\\ln[(V_\\infty-V_0)/(V_\\infty-V_t)]$ against time.',
        'bn': 'নির্দিষ্ট সময় পর পর উপস্থিত অ্যাসিড টাইট্রেশন করে অম্ল-অনুঘটিত এস্টার হাইড্রোলাইসিস অনুসরণ এবং সময়ের বিপরীতে $\\ln[(V_\\infty-V_0)/(V_\\infty-V_t)]$-এর ঢাল থেকে প্রথম ক্রমের আচরণ যাচাই।',
    },
    'flame-test-cations': {
        'en': 'Identify the metal cation in unknown salts from the colour they give a flame and confirm each identity with an independent wet-chemical test.',
        'bn': 'শিখায় যে রং দেয় তা থেকে অজানা লবণের ধাতব ক্যাটায়ন শনাক্ত করা এবং প্রতিটি শনাক্তকরণ আলাদা আর্দ্র-রাসায়নিক পরীক্ষায় নিশ্চিত করা।',
    },
    'hcl-sodium-carbonate-standardization': {
        'en': 'Standardise a hydrochloric acid solution against primary-standard sodium carbonate and report its molarity.',
        'bn': 'প্রাথমিক মানের সোডিয়াম কার্বোনেটের বিরুদ্ধে হাইড্রোক্লোরিক অ্যাসিড দ্রবণের প্রমাণীকরণ এবং তার মোলারিটি লিখে রাখা।',
    },
    'hydrogen-peroxide-decomposition': {
        'en': 'Follow the decomposition of hydrogen peroxide from the volume of oxygen released and test whether the reaction is first order.',
        'bn': 'নির্গত অক্সিজেনের আয়তন থেকে হাইড্রোজেন পারঅক্সাইডের বিয়োজন অনুসরণ এবং বিক্রিয়াটি প্রথম ক্রমের কি না যাচাই।',
    },
    'iodine-clock-rate-law': {
        'en': 'Measure the iodine-clock time at several reactant concentrations and estimate the order of reaction from the slope of $\\log(1/t)$ against $\\log c$.',
        'bn': 'বিভিন্ন বিকারক ঘনমাত্রায় আয়োডিন ঘড়ির সময় মেপে $\\log(1/t)$ বনাম $\\log c$-এর ঢাল থেকে বিক্রিয়ার ক্রম অনুমান।',
    },
    'liquid-partition-coefficient': {
        'en': 'Determine the partition coefficient of a solute between two immiscible solvents and check that it stays constant from different starting concentrations.',
        'bn': 'দুই অমিশ্রণীয় দ্রাবকে দ্রবের বণ্টন সহগ নির্ণয় এবং ভিন্ন শুরুর ঘনমাত্রা থেকে তা ধ্রুব থাকে কি না যাচাই।',
    },
    'mohr-chloride-titration': {
        'en': 'Determine the chloride content of a sample by Mohr’s argentometric titration with silver nitrate and potassium chromate indicator.',
        'bn': 'সিলভার নাইট্রেট ও পটাশিয়াম ক্রোমেট নির্দেশক দিয়ে মোহরের অ্যার্জেন্টোমেট্রিক টাইট্রেশনে নমুনার ক্লোরাইড নির্ণয়।',
    },
    'naoh-oxalic-standardization': {
        'en': 'Standardise a sodium hydroxide solution against primary-standard oxalic acid and report its molarity.',
        'bn': 'প্রাথমিক মানের অক্সালিক অ্যাসিডের বিরুদ্ধে সোডিয়াম হাইড্রক্সাইড দ্রবণের প্রমাণীকরণ এবং তার মোলারিটি লিখে রাখা।',
    },
    'nernst-cell-concentration': {
        'en': 'Verify the Nernst equation with a concentration cell by plotting emf against $\\ln(a_2/a_1)$ and comparing the slope with $RT/zF$.',
        'bn': 'ঘনত্ব কোষে emf বনাম $\\ln(a_2/a_1)$ লেখচিত্র এঁকে নার্নস্ট সমীকরণ যাচাই এবং ঢালের তুলনা $RT/zF$-এর সঙ্গে।',
    },
    'neutralization-calorimetry': {
        'en': 'Measure the temperature rise when a strong acid neutralises a strong base and calculate the enthalpy of neutralisation per mole of water formed.',
        'bn': 'শক্ত অ্যাসিড ও শক্ত ক্ষারকের প্রশমনে তাপমাত্রা বৃদ্ধি মেপে উৎপন্ন প্রতি মোল পানির জন্য প্রশমন এনথালপি হিসাব।',
    },
    'nickel-dmg-gravimetry': {
        'en': 'Determine nickel in a solution gravimetrically by precipitating it as nickel dimethylglyoxime and weighing the dried precipitate.',
        'bn': 'নিকেল ডাইমিথাইলগ্লাইঅক্সিমেট হিসেবে অধঃক্ষিপ্ত করে এবং শুকনো অধঃক্ষেপের ওজন নিয়ে ভরবিধিতে দ্রবণের নিকেল নির্ণয়।',
    },
    'ostwald-viscometer-relative': {
        'en': 'Compare the viscosity of a liquid with that of water using an Ostwald viscometer, from the flow times and densities.',
        'bn': 'প্রবাহ সময় ও ঘনত্ব থেকে অস্টওয়াল্ড সান্দ্রতামাপক ব্যবহার করে পানির তুলনায় একটি তরলের সান্দ্রতা নির্ণয়।',
    },
    'permanganate-ferrous-titration': {
        'en': 'Estimate ferrous iron by titration with standard potassium permanganate in dilute sulfuric acid, using the permanganate as its own indicator.',
        'bn': 'লঘু সালফিউরিক অ্যাসিডে আদর্শ পটাশিয়াম পারম্যাঙ্গানেট দিয়ে টাইট্রেশনে ফেরাস লোহা নির্ণয়, যেখানে পারম্যাঙ্গানেট নিজেই নির্দেশক।',
    },
    'potentiometric-ferrous-ceric': {
        'en': 'Follow the $Fe^{2+}-Ce^{4+}$ titration with a potentiometer and locate the equivalence point from the maximum of $\\Delta E/\\Delta V$.',
        'bn': 'পোটেনশিয়োমিটার দিয়ে $Fe^{2+}-Ce^{4+}$ টাইট্রেশন অনুসরণ এবং $\\Delta E/\\Delta V$-এর সর্বোচ্চ মান থেকে তুল্যতা বিন্দু নির্ণয়।',
    },
    'stalagmometer-surface-tension': {
        'en': 'Compare the surface tension of a liquid with that of water by counting the drops a stalagmometer delivers for a fixed volume.',
        'bn': 'নির্দিষ্ট আয়তনে স্ট্যালাগমোমিটার কতটি ফোঁটা দেয় তা গুনে পানির তুলনায় একটি তরলের পৃষ্ঠটান নির্ণয়।',
    },
    'sulfate-gravimetry-baso4': {
        'en': 'Determine the sulfate in a sample gravimetrically by precipitating it as barium sulfate, igniting and weighing the precipitate.',
        'bn': 'বেরিয়াম সালফেট হিসেবে অধঃক্ষিপ্ত করে, উত্তপ্ত করে ও ওজন নিয়ে ভরবিধিতে নমুনার সালফেট নির্ণয়।',
    },
    'thin-layer-chromatography-honours': {
        'en': 'Separate the components of a mixture by thin-layer chromatography and calculate the $R_f$ value of each spot against a standard.',
        'bn': 'পাতলা-স্তর ক্রোমাটোগ্রাফিতে মিশ্রণের উপাদান পৃথক করা এবং আদর্শ নমুনার বিপরীতে প্রতিটি দাগের $R_f$ মান নির্ণয়।',
    },
    'vitamin-c-iodimetry': {
        'en': 'Determine the vitamin C content of a sample by direct iodimetry with a standard iodine solution.',
        'bn': 'আদর্শ আয়োডিন দ্রবণ দিয়ে প্রত্যক্ষ আয়োডিমেট্রি পদ্ধতিতে নমুনার ভিটামিন C-এর পরিমাণ নির্ণয়।',
    },
    'volhard-chloride-back-titration': {
        'en': 'Determine chloride by Volhard back-titration: add excess silver nitrate, then titrate the leftover silver with thiocyanate.',
        'bn': 'ভলহার্ডের বিপরীত টাইট্রেশনে ক্লোরাইড নির্ণয়: অতিরিক্ত সিলভার নাইট্রেট যোগ করে অবশিষ্ট সিলভার থায়োসায়ানেট দিয়ে টাইট্রেট করা।',
    },
    'atwood-machine-acceleration': {
        'en': 'Measure the acceleration of an Atwood machine from the distance fallen and the time taken, and compare it with $(m_1-m_2)g/(m_1+m_2)$.',
        'bn': 'অতিক্রান্ত দূরত্ব ও সময় থেকে অ্যাটউড যন্ত্রের ত্বরণ মেপে $(m_1-m_2)g/(m_1+m_2)$-এর সঙ্গে তুলনা।',
    },
    'beam-bending-modulus': {
        'en': 'Find the Young modulus of a beam material from its central deflection under known loads, plotting deflection against force.',
        'bn': 'জানা ভারে বিমের কেন্দ্রীয় বাঁকন থেকে উপাদানের ইয়ং গুণাঙ্ক নির্ণয়, যেখানে বাঁকন বনাম বলের লেখচিত্র আঁকা হয়।',
    },
    'capillary-rise-tension': {
        'en': 'Determine the surface tension of water from the rise in capillaries of different radii, assuming complete wetting.',
        'bn': 'পূর্ণ ভেজা ধরে নিয়ে বিভিন্ন ব্যাসার্ধের কৈশিক নলে পানির উত্থান থেকে পৃষ্ঠটান নির্ণয়।',
    },
    'franck-hertz-mercury': {
        'en': 'Measure the first excitation potential of mercury from the spacing of the current peaks in a Franck–Hertz tube.',
        'bn': 'ফ্রাঙ্ক–হার্টজ নলে প্রবাহের শীর্ষগুলোর ব্যবধান থেকে পারদের প্রথম উত্তেজনা বিভব নির্ণয়।',
    },
    'grating-spectrometer-wavelength': {
        'en': 'Determine the wavelength of a spectral line with a plane diffraction grating and a spectrometer, using the symmetric diffraction angles.',
        'bn': 'সমতল অপবর্তন গ্রেটিং ও বর্ণালিবীক্ষণ যন্ত্র দিয়ে প্রতিসম অপবর্তন কোণ ব্যবহার করে বর্ণালী রেখার তরঙ্গদৈর্ঘ্য নির্ণয়।',
    },
    'inclined-plane-friction': {
        'en': 'Find the coefficient of static friction between two surfaces from the angle at which a block on an incline just starts to slide.',
        'bn': 'ঢালু তলে রাখা ব্লক ঠিক যখন পিছলে শুরু করে সেই কোণ থেকে দুই তলের মধ্যকার স্থির ঘর্ষণ গুণাঙ্ক নির্ণয়।',
    },
    'joules-heat-equivalent': {
        'en': 'Compare the electrical energy $VIt$ delivered to a heater with the heat gained by the water and the calorimeter to find the mechanical equivalent of heat.',
        'bn': 'হিটারে সরবরাহ করা তড়িৎ শক্তি $VIt$-এর সঙ্গে পানি ও ক্যালোরিমিটারের গৃহীত তাপ তুলনা করে তাপের যান্ত্রিক সমতুল্য নির্ণয়।',
    },
    'katers-pendulum-gravity': {
        'en': 'Determine the acceleration due to gravity with Kater’s reversible pendulum by finding the position where the periods about the two knife edges are equal.',
        'bn': 'কেটারের প্রত্যাবর্তী দোলকে দুই ছুরক-ধারের পর্যায়কাল সমান হয় এমন অবস্থান খুঁজে অভিকর্ষজ ত্বরণ নির্ণয়।',
    },
    'lcr-series-resonance-lab': {
        'en': 'Sweep the frequency of a series LCR circuit at fixed source amplitude to find the resonant frequency, the half-power points and the quality factor.',
        'bn': 'উৎসের বিস্তার স্থির রেখে সারি LCR বর্তনীর কম্পাঙ্ক বদলে অনুনাদ কম্পাঙ্ক, অর্ধক্ষমতা বিন্দু ও মান গুণাঙ্ক নির্ণয়।',
    },
    'lees-disc-conductivity': {
        'en': 'Determine the thermal conductivity of a poor conductor with Lee’s disc, using the steady face temperatures and the cooling rate of the disc.',
        'bn': 'লির চাকতিতে দুই তলের স্থির তাপমাত্রা ও চাকতির শীতলনের হার ব্যবহার করে কুপরিবাহীর তাপ পরিবাহিতা নির্ণয়।',
    },
    'meldes-string-frequency': {
        'en': 'Study standing waves on a stretched string with Melde’s apparatus and compare the measured wave speed with $\\sqrt{\\mathcal{T}/\\mu}$.',
        'bn': 'মেল্ডের যন্ত্রে টানটান তারের স্থির তরঙ্গ পর্যবেক্ষণ এবং পরিমাপিত তরঙ্গ বেগের তুলনা $\\sqrt{\\mathcal{T}/\\mu}$-এর সঙ্গে।',
    },
    'newtons-rings-radius': {
        'en': 'Determine the wavelength of sodium light from the diameters of Newton’s rings, plotting $D_m^2$ against the ring number.',
        'bn': 'নিউটনের বলয়ের ব্যাস থেকে সোডিয়াম আলোর তরঙ্গদৈর্ঘ্য নির্ণয়, যেখানে $D_m^2$ বনাম বলয় সংখ্যার লেখচিত্র আঁকা হয়।',
    },
    'photoelectric-planck-honours': {
        'en': 'Measure the stopping potential at several light frequencies and find Planck’s constant from the slope of $V_s$ against $f$.',
        'bn': 'বিভিন্ন আলোর কম্পাঙ্কে নিবৃত্তি বিভব মেপে $V_s$ বনাম $f$-এর ঢাল থেকে প্ল্যাঙ্ক ধ্রুবক নির্ণয়।',
    },
    'pn-diode-iv-lab': {
        'en': 'Plot the forward and reverse current–voltage characteristics of a p–n junction diode and estimate its dynamic resistance.',
        'bn': 'p–n সন্ধি ডায়োডের সম্মুখ ও পশ্চাৎ প্রবাহ–বিভব বৈশিষ্ট্য রেখা অঙ্কন এবং তার গতিশীল রোধ অনুমান।',
    },
    'poiseuille-viscosity': {
        'en': 'Determine the viscosity of a liquid from its steady rate of flow through a capillary tube under Poiseuille flow.',
        'bn': 'পয়জুই প্রবাহে কৈশিক নলের মধ্য দিয়ে তরলের স্থির প্রবাহ হার থেকে তার সান্দ্রতা নির্ণয়।',
    },
    'polarimetry-sugar': {
        'en': 'Measure how a sugar solution rotates plane-polarised light and find its specific rotation from the slope of angle against concentration.',
        'bn': 'চিনির দ্রবণ সমতল-সমবর্তিত আলোকে কতটা ঘোরায় তা মেপে কোণ বনাম ঘনমাত্রার ঢাল থেকে এর আপেক্ষিক আলোক ঘূর্ণন নির্ণয়।',
    },
    'prism-minimum-deviation': {
        'en': 'Determine the refractive index of the prism material from the prism angle and the angle of minimum deviation.',
        'bn': 'প্রিজমের কোণ ও ন্যূনতম বিচ্যুতি কোণ থেকে প্রিজম উপাদানের প্রতিসরাঙ্ক নির্ণয়।',
    },
    'resonance-tube-speed': {
        'en': 'Determine the speed of sound in air from the two resonant lengths of a tube for a tuning fork of known frequency.',
        'bn': 'জানা কম্পাঙ্কের সুরশলাকার জন্য নলের দুই অনুনাদ দৈর্ঘ্য থেকে বাতাসে শব্দের বেগ নির্ণয়।',
    },
    'rigidity-torsion-pendulum': {
        'en': 'Determine the rigidity modulus of a wire from the period of a torsion pendulum carrying a known moment of inertia.',
        'bn': 'জানা জড়তার ভ্রামকযুক্ত পাক দোলকের পর্যায়কাল থেকে তারের দৃঢ়তা গুণাঙ্ক নির্ণয়।',
    },
    'searles-young-modulus': {
        'en': 'Determine the Young modulus of a wire with Searle’s apparatus by measuring the extension produced by known loads.',
        'bn': 'সিয়ার্লের যন্ত্রে জানা ভারে সৃষ্ট প্রসারণ মেপে তারের ইয়ং গুণাঙ্ক নির্ণয়।',
    },
    'specific-heat-calorimetry-honours': {
        'en': 'Find the specific heat capacity of a solid by mixing calorimetry, applying a cooling correction where the transfer takes long.',
        'bn': 'মিশ্রণ ক্যালরিমিতিতে কঠিনের আপেক্ষিক তাপ নির্ণয়, এবং স্থানান্তরে সময় লাগলে শীতলন সংশোধন প্রয়োগ।',
    },
    'stokes-falling-sphere': {
        'en': 'Determine the viscosity of a liquid from the terminal speed of a falling sphere, applying a wall correction for the vessel.',
        'bn': 'পতনশীল গোলকের প্রান্তিক বেগ থেকে তরলের সান্দ্রতা নির্ণয় এবং পাত্রের জন্য দেয়াল সংশোধন প্রয়োগ।',
    },
    'thermocouple-seebeck': {
        'en': 'Measure the thermo-emf of a thermocouple at several temperature differences and find the Seebeck coefficient from the slope of emf against $\\Delta T$.',
        'bn': 'বিভিন্ন তাপমাত্রা পার্থক্যে তাপযুগলের তাপ-তড়িচ্চালক বল মেপে emf বনাম $\\Delta T$-এর ঢাল থেকে সিবেক সহগ নির্ণয়।',
    },
    'transformer-characteristics-lab': {
        'en': 'Compare the secondary-to-primary voltage ratio of a transformer with its turns ratio at no load and measure its efficiency under load.',
        'bn': 'ট্রান্সফরমারের গৌণ ও মূল বিভবের অনুপাতের সঙ্গে খালি অবস্থায় পাক অনুপাতের তুলনা এবং ভারযুক্ত অবস্থায় দক্ষতা নির্ণয়।',
    },
    'zener-regulator-lab': {
        'en': 'Study how a Zener diode holds the output voltage steady while the input voltage and the load current change.',
        'bn': 'প্রবেশ বিভব ও লোড প্রবাহ বদলালে জেনার ডায়োড কীভাবে নির্গম বিভব স্থির রাখে তা পর্যবেক্ষণ।',
    },
}
