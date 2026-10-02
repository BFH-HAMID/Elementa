export type PhysicalConstant = { symbol: string; name: string; name_bn: string; value: string; unit: string; note: string };

export const physicalConstants: PhysicalConstant[] = [
  { symbol: 'c', name: 'Speed of light in vacuum', name_bn: 'শূন্যস্থানে আলোর বেগ', value: '299 792 458', unit: 'm s⁻¹', note: 'Defined exactly.' },
  { symbol: 'G', name: 'Gravitational constant', name_bn: 'মহাকর্ষীয় ধ্রুবক', value: '6.67430 × 10⁻¹¹', unit: 'N m² kg⁻²', note: 'Measured constant; uncertainty applies.' },
  { symbol: 'h', name: 'Planck constant', name_bn: 'প্ল্যাঙ্ক ধ্রুবক', value: '6.62607015 × 10⁻³⁴', unit: 'J s', note: 'Defined exactly in the SI.' },
  { symbol: 'e', name: 'Elementary charge', name_bn: 'মৌলিক চার্জ', value: '1.602176634 × 10⁻¹⁹', unit: 'C', note: 'Magnitude of one elementary charge.' },
  { symbol: 'kB', name: 'Boltzmann constant', name_bn: 'বোল্টজম্যান ধ্রুবক', value: '1.380649 × 10⁻²³', unit: 'J K⁻¹', note: 'Connects temperature with energy.' },
  { symbol: 'NA', name: 'Avogadro constant', name_bn: 'অ্যাভোগাড্রো ধ্রুবক', value: '6.02214076 × 10²³', unit: 'mol⁻¹', note: 'Exactly defined number per mole.' },
  { symbol: 'R', name: 'Molar gas constant', name_bn: 'মোলার গ্যাস ধ্রুবক', value: '8.314462618', unit: 'J mol⁻¹ K⁻¹', note: 'R = NA kB.' },
  { symbol: 'g', name: 'Standard gravity', name_bn: 'প্রমাণ মহাকর্ষজ ত্বরণ', value: '9.80665', unit: 'm s⁻²', note: 'Reference value near Earth.' },
  { symbol: 'ε0', name: 'Vacuum permittivity', name_bn: 'শূন্যস্থানের পারমিটিভিটি', value: '8.8541878128 × 10⁻¹²', unit: 'F m⁻¹', note: 'Useful in electrostatics.' },
  { symbol: 'μ0', name: 'Vacuum permeability', name_bn: 'শূন্যস্থানের পারমিয়াবিলিটি', value: '1.25663706212 × 10⁻⁶', unit: 'N A⁻²', note: 'The SI value is experimentally related to α.' }
];

export const prefixes = [
  ['pico', 'p', '10⁻¹²'], ['nano', 'n', '10⁻⁹'], ['micro', 'μ', '10⁻⁶'], ['milli', 'm', '10⁻³'],
  ['centi', 'c', '10⁻²'], ['kilo', 'k', '10³'], ['mega', 'M', '10⁶'], ['giga', 'G', '10⁹'], ['tera', 'T', '10¹²']
];

export type Element = { number: number; symbol: string; name: string; name_bn: string; mass: string; category: string; group: number; period: number; color: string; detail: string };

export const periodicElements: Element[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', name_bn: 'হাইড্রোজেন', mass: '1.008', category: 'Nonmetal', group: 1, period: 1, color: 'blue', detail: 'The lightest element; it forms water with oxygen.' },
  { number: 2, symbol: 'He', name: 'Helium', name_bn: 'হিলিয়াম', mass: '4.003', category: 'Noble gas', group: 18, period: 1, color: 'purple', detail: 'A very light, chemically unreactive noble gas.' },
  { number: 3, symbol: 'Li', name: 'Lithium', name_bn: 'লিথিয়াম', mass: '6.94', category: 'Alkali metal', group: 1, period: 2, color: 'orange', detail: 'A soft metal used in rechargeable batteries.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', name_bn: 'বেরিলিয়াম', mass: '9.012', category: 'Alkaline earth metal', group: 2, period: 2, color: 'orange', detail: 'A light, stiff metal used in specialised alloys.' },
  { number: 5, symbol: 'B', name: 'Boron', name_bn: 'বোরন', mass: '10.81', category: 'Metalloid', group: 13, period: 2, color: 'teal', detail: 'A metalloid important in glass and semiconductor chemistry.' },
  { number: 6, symbol: 'C', name: 'Carbon', name_bn: 'কার্বন', mass: '12.011', category: 'Nonmetal', group: 14, period: 2, color: 'blue', detail: 'The versatile backbone of organic molecules.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', name_bn: 'নাইট্রোজেন', mass: '14.007', category: 'Nonmetal', group: 15, period: 2, color: 'blue', detail: 'A major component of air and amino acids.' },
  { number: 8, symbol: 'O', name: 'Oxygen', name_bn: 'অক্সিজেন', mass: '15.999', category: 'Nonmetal', group: 16, period: 2, color: 'blue', detail: 'Supports respiration and many combustion reactions.' },
  { number: 9, symbol: 'F', name: 'Fluorine', name_bn: 'ফ্লোরিন', mass: '18.998', category: 'Halogen', group: 17, period: 2, color: 'green', detail: 'The most electronegative element.' },
  { number: 10, symbol: 'Ne', name: 'Neon', name_bn: 'নিয়ন', mass: '20.180', category: 'Noble gas', group: 18, period: 2, color: 'purple', detail: 'A noble gas famous for bright discharge tubes.' },
  { number: 11, symbol: 'Na', name: 'Sodium', name_bn: 'সোডিয়াম', mass: '22.990', category: 'Alkali metal', group: 1, period: 3, color: 'orange', detail: 'A reactive metal found in common ionic salts.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', name_bn: 'ম্যাগনেসিয়াম', mass: '24.305', category: 'Alkaline earth metal', group: 2, period: 3, color: 'orange', detail: 'A light metal and a central atom in chlorophyll.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', name_bn: 'অ্যালুমিনিয়াম', mass: '26.982', category: 'Post-transition metal', group: 13, period: 3, color: 'slate', detail: 'A light, corrosion-resistant structural metal.' },
  { number: 14, symbol: 'Si', name: 'Silicon', name_bn: 'সিলিকন', mass: '28.085', category: 'Metalloid', group: 14, period: 3, color: 'teal', detail: 'A semiconductor used in electronics.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', name_bn: 'ফসফরাস', mass: '30.974', category: 'Nonmetal', group: 15, period: 3, color: 'blue', detail: 'Important in biological energy transfer and fertilisers.' },
  { number: 16, symbol: 'S', name: 'Sulfur', name_bn: 'সালফার', mass: '32.06', category: 'Nonmetal', group: 16, period: 3, color: 'blue', detail: 'A yellow nonmetal found in proteins and minerals.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', name_bn: 'ক্লোরিন', mass: '35.45', category: 'Halogen', group: 17, period: 3, color: 'green', detail: 'A reactive halogen used for safe water treatment.' },
  { number: 18, symbol: 'Ar', name: 'Argon', name_bn: 'আর্গন', mass: '39.948', category: 'Noble gas', group: 18, period: 3, color: 'purple', detail: 'An inert gas used in lamps and welding shields.' },
  { number: 19, symbol: 'K', name: 'Potassium', name_bn: 'পটাশিয়াম', mass: '39.098', category: 'Alkali metal', group: 1, period: 4, color: 'orange', detail: 'A reactive metal and essential biological ion.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', name_bn: 'ক্যালসিয়াম', mass: '40.078', category: 'Alkaline earth metal', group: 2, period: 4, color: 'orange', detail: 'A structural element in bones and limestone.' },
  { number: 26, symbol: 'Fe', name: 'Iron', name_bn: 'লোহা', mass: '55.845', category: 'Transition metal', group: 8, period: 4, color: 'slate', detail: 'A transition metal central to steel and haemoglobin.' },
  { number: 29, symbol: 'Cu', name: 'Copper', name_bn: 'তামা', mass: '63.546', category: 'Transition metal', group: 11, period: 4, color: 'slate', detail: 'A good electrical conductor used in wiring.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', name_bn: 'দস্তা', mass: '65.38', category: 'Transition metal', group: 12, period: 4, color: 'slate', detail: 'Used to protect steel through galvanisation.' },
  { number: 47, symbol: 'Ag', name: 'Silver', name_bn: 'রূপা', mass: '107.868', category: 'Transition metal', group: 11, period: 5, color: 'slate', detail: 'A highly conductive metal with reflective surfaces.' },
  { number: 79, symbol: 'Au', name: 'Gold', name_bn: 'সোনা', mass: '196.967', category: 'Transition metal', group: 11, period: 6, color: 'gold', detail: 'A corrosion-resistant metal with a distinctive colour.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', name_bn: 'পারদ', mass: '200.592', category: 'Transition metal', group: 12, period: 6, color: 'slate', detail: 'A liquid metal at room temperature; handle safely.' },
  { number: 92, symbol: 'U', name: 'Uranium', name_bn: 'ইউরেনিয়াম', mass: '238.029', category: 'Actinide', group:  actinideGroup(), period: 7, color: 'pink', detail: 'A heavy radioactive element studied in nuclear science.' }
];

function actinideGroup(): number { return 0; }
