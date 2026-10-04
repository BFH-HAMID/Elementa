"""Shared helpers for repairing content formatting.

Two problems made the Bangla formula and report pages hard to read:

1. Relations were pasted into prose as bare LaTeX or as unicode "plain text"
   maths (`Y=FL/(AΔL)`, `1/[A]-1/[A]_0=kt;\quad...`), so readers saw command
   names, stray braces and run-on formula chains instead of typeset maths.
2. Several chains joined two unrelated relations with `\quad`, which renders as
   one long unreadable line.

This module normalises LaTeX (splitting chains into `aligned` blocks, turning
`a/b` into real fractions, mapping unicode super/subscripts and Greek letters)
and provides a small line-oriented editor so frontmatter can be rewritten
without reformatting the whole YAML document.

Content must render through `components/content/MathText.tsx`, which treats
`$...$` as inline maths and `$$...$$` as display maths.
"""

import json
import re
import unicodedata

SUPERSCRIPTS = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7',
    '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', 'ⁿ': 'n', 'ⁱ': 'i',
}
SUBSCRIPTS = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7',
    '₈': '8', '₉': '9', '₊': '+', '₋': '-', 'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x',
    'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't',
    # Modifier-letter subscripts (`nᵢ`, `xᵣ`) and subscript brackets.
    'ᵢ': 'i', 'ᵣ': 'r', 'ᵤ': 'u', 'ᵥ': 'v', 'ⱼ': 'j', '₍': '(', '₎': ')',
}
GREEK = {
    'α': r'\alpha', 'β': r'\beta', 'γ': r'\gamma', 'δ': r'\delta', 'ε': r'\epsilon',
    'ζ': r'\zeta', 'η': r'\eta', 'θ': r'\theta', 'κ': r'\kappa', 'λ': r'\lambda',
    'μ': r'\mu', 'ν': r'\nu', 'ξ': r'\xi', 'π': r'\pi', 'ρ': r'\rho', 'σ': r'\sigma',
    'τ': r'\tau', 'υ': r'\upsilon', 'φ': r'\phi', 'χ': r'\chi', 'ψ': r'\psi',
    'ω': r'\omega', 'Γ': r'\Gamma', 'Δ': r'\Delta', 'Θ': r'\Theta', 'Λ': r'\Lambda',
    'Π': r'\Pi', 'Σ': r'\Sigma', 'Φ': r'\Phi', 'Ψ': r'\Psi', 'Ω': r'\Omega',
}
OPERATORS = {
    '≈': r'\approx ', '∝': r'\propto ', '×': r'\times ', '÷': r'\div ', '·': r'\cdot ',
    '−': '-', '–': '-', '—': '-', '√': r'\sqrt', '∞': r'\infty ', '°': r'^\circ',
    '≫': r'\gg ', '≪': r'\ll ', '≤': r'\le ', '≥': r'\ge ', '≠': r'\ne ', '±': r'\pm ',
    '→': r'\to ', '⇒': r'\Rightarrow ', '∈': r'\in ', '∑': r'\sum ', '∫': r'\int ',
    '½': r'\tfrac{1}{2}', '⅓': r'\tfrac{1}{3}', '¼': r'\tfrac{1}{4}',
    '𝒯': r'\mathcal{T}', 'ℏ': r'\hbar ',
}
FUNCTIONS = ('arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'sin', 'cos', 'tan',
             'log', 'ln', 'exp', 'max', 'min', 'lim')

LATEX_HINT = re.compile(r'\\(?:frac|sqrt|quad|log|mathrm|text|Delta|alpha|beta|gamma|theta|lambda|omega|pi|rho|mu|nu|tau|eta|kappa|sigma|epsilon|infty|times|approx|propto|partial|sum|int|begin|left|right|boldsymbol|mathbf|mathcal|circ|le|ge|ll|gg|to|Rightarrow|hbar)|[_^]\{')


def looks_like_latex(text: str) -> bool:
    return bool(LATEX_HINT.search(text))


def _sup_sub_to_latex(text: str) -> str:
    """Turn runs of unicode super/subscript characters into LaTeX groups."""
    def replace_run(match, opening, closing, table):
        raw = match.group(0)
        body = ''.join(table.get(ch, ch) for ch in raw)
        return f'{opening}{body}{closing}'

    text = re.sub('[' + ''.join(SUPERSCRIPTS) + ']+', lambda m: replace_run(m, '^{', '}', SUPERSCRIPTS), text)
    text = re.sub('[' + ''.join(SUBSCRIPTS) + ']+', lambda m: replace_run(m, '_{', '}', SUBSCRIPTS), text)
    return text


def _protect_braces(text: str) -> tuple[str, list[str]]:
    """Hide balanced `{...}` groups so fractions are never built inside them."""
    store: list[str] = []

    def stash(match):
        store.append(match.group(0))
        return f'\x00{len(store) - 1}\x00'

    previous = None
    while previous != text:
        previous = text
        text = re.sub(r'\{[^{}]*\}', stash, text)
    return text, store


def _restore_braces(text: str, store: list[str]) -> str:
    for index in range(len(store) - 1, -1, -1):
        text = text.replace(f'\x00{index}\x00', store[index])
    return text


_ATOM = (r'(?:\\[A-Za-z]+(?:_\x00\d+\x00|\^\x00\d+\x00|_[A-Za-z0-9]|\^[A-Za-z0-9])?|\[[^\]\[]*\]|\([^()\[\]]*\)|'
         r'[A-Za-z0-9](?:_\x00\d+\x00|\^\x00\d+\x00|_[A-Za-z0-9]|\^[A-Za-z0-9])?)')
# Greek letters become commands followed by a space (`\omega C`), so a term may
# span single spaces: `1/\omega C` must keep `\omega C` as one denominator.
_TERM = rf'(?:{_ATOM}(?: ?{_ATOM})*)'
_FRACTION = re.compile(rf'(?<![\w\\}}]){_TERM}\s*/\s*{_TERM}')


def _unwrap(term: str) -> str:
    """Drop one redundant pair of parentheses around a fraction argument."""
    if term.startswith('(') and term.endswith(')'):
        depth = 0
        for index, char in enumerate(term):
            if char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
                if depth == 0 and index != len(term) - 1:
                    return term
        return term[1:-1]
    return term


# Macros that consume the next token as an argument: turning `\mathbf A/dt`
# into `\mathbf \frac{A}{dt}` would break the relation, so such terms are left
# exactly as the author wrote them.
_ARGUMENT_MACROS = (
    '\\partial', '\\mathbf', '\\boldsymbol', '\\vec', '\\dot', '\\ddot', '\\bar',
    '\\hat', '\\tilde', '\\overline', '\\underline', '\\text', '\\mathrm', '\\mathcal',
    '\\sqrt', '\\frac', '\\tfrac', '\\operatorname', '\\int', '\\sum',
)


def _fractionise(text: str) -> str:
    """Rewrite `a/b` into `\frac{a}{b}` where both sides are simple terms."""
    protected, store = _protect_braces(text)

    def repl(match):
        left, right = [part.strip() for part in match.group(0).split('/', 1)]
        left, right = _unwrap(left), _unwrap(right)
        context = protected[max(0, match.start() - 16):match.start()]
        if any(macro in match.group(0) or context.rstrip().endswith(macro) for macro in _ARGUMENT_MACROS):
            return match.group(0)
        if re.fullmatch(r'\d', left) and re.fullmatch(r'\d', right):
            return rf'\tfrac{{{left}}}{{{right}}}'
        return rf'\frac{{{left}}}{{{right}}}'

    protected = _FRACTION.sub(repl, protected)
    return _restore_braces(protected, store)


def normalise_latex(value: str, fractionise: bool = True, prose: bool = False) -> str:
    """Clean a single LaTeX relation so KaTeX renders it legibly.

    `prose=True` additionally infers subscripts from unicode plain-text maths
    (`P_absolute`, `Vs/Vp`). That inference is unsafe on relations that are
    already LaTeX — `C_nH_{2n+2}` must stay two separate subscripts — so it is
    only used while wrapping bare prose fragments.
    """
    text = value.strip()
    for char, replacement in OPERATORS.items():
        text = text.replace(char, replacement)
    for char, replacement in GREEK.items():
        text = text.replace(char, replacement + ' ')
    text = _sup_sub_to_latex(text)
    # `√[...]` and `√(...)` are square roots of the whole bracketed group.
    text = re.sub(r'\\sqrt\s*\[([^\[\]]*)\]', lambda m: '\\sqrt{' + m.group(1) + '}', text)
    text = re.sub(r'\\sqrt\s*\(([^()]*)\)', lambda m: '\\sqrt{' + m.group(1) + '}', text)
    text = re.sub(r'\\sqrt\s*([A-Za-z0-9]+)', lambda m: '\\sqrt{' + m.group(1) + '}', text)
    for name in FUNCTIONS:
        # A digit may precede the name (`2cosθ`), but a letter or backslash may
        # not, otherwise `\cos` would be split into a new command name. After a
        # script indicator the name needs a group, because KaTeX rejects a
        # function as a bare subscript: `λ_max` must become `\lambda_{\max}`.
        def upright(match: re.Match, name: str = name) -> str:
            before = match.string[match.start() - 1] if match.start() else ''
            return '{\\' + name + '}' if before in '_^' else '\\' + name

        text = re.sub(rf'(?<![\\A-Za-z]){name}(?![A-Za-z])', upright, text)
    text = re.sub(r'(?<![\\\w])(?<!\\mathrm\{)(?<!\\text\{)pH(?![A-Za-z])', lambda _m: '\\mathrm{pH}', text)
    # `pK_a`, `pK_{a}` and bare `pKa` all become upright p with a subscript,
    # but a closing brace that belongs to an outer group must never be eaten.
    text = re.sub(
        r'(?<![\\\w])(?<!\\mathrm\{)(?<!\\text\{)pK(?:_\{(?P<braced>[aAbB])\}|_?(?P<bare>[aAbB]))(?![A-Za-z])',
        lambda m: '\\mathrm{p}K_{' + (m.group('braced') or m.group('bare')) + '}',
        text,
    )
    if prose:
        # `P_absolute` must not become P with a subscript "a" followed by the
        # text "bsolute": a multi-letter subscript always needs braces. The run
        # must be one case, though — `k_BT` is `k_B` times `T`, not `k_{BT}`.
        text = re.sub(
            r'(?<![\\\w])([A-Za-z]|\\[A-Za-z]+)\s*_([a-z]{2,}|[A-Z]{3,})(?![A-Za-z])',
            lambda m: m.group(1) + '_{\\mathrm{' + m.group(2) + '}}',
            text,
        )
        # `Vs/Vp`, `Imax`, `Vout` are subscripted quantities in these notes; two
        # uppercase letters (`FL`, `RT`) stay a product and are left alone.
        # `Ca` is calcium, not C with a subscript "a": element symbols keep
        # their second letter.
        text = re.sub(
            r'(?<![A-Za-z\\])([A-Z])([a-z]{1,3})(?![A-Za-z_])',
            lambda m: m.group(0) if m.group(0) in ELEMENTS
            else m.group(1) + '_{\\mathrm{' + m.group(2) + '}}',
            text,
        )
    # `*` is a multiplication sign in these notes, and a macro must not be
    # separated from the subscript that belongs to it (`\epsilon _0`).
    text = text.replace('*', r'\cdot ')
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'(\\[A-Za-z]+) (?=[_^])', r'\1', text)
    if fractionise:
        text = _fractionise(text)
    return text.strip().strip(';').strip()


CHAIN_SPLIT = re.compile(r'\s*[;,]\s*\\q?quad\s*')


def split_chain(value: str) -> list[str]:
    """Split `A;\quad B` chains into their separate relations."""
    parts = [part.strip().strip(';,').strip() for part in CHAIN_SPLIT.split(value)]
    return [part for part in parts if part]


def chain_to_aligned(value: str) -> str:
    """Render a multi-relation chain as an aligned block, one relation per line."""
    parts = split_chain(value)
    if len(parts) < 2:
        return parts[0] if parts else value
    lines = []
    for part in parts:
        if '=' in part and '&' not in part:
            left, right = part.split('=', 1)
            lines.append(f'{left.strip()} &= {right.strip()}')
        else:
            lines.append(part)
    return '\\begin{aligned} ' + ' \\\\ '.join(lines) + ' \\end{aligned}'


def inline_math(prose: str) -> str:
    """Wrap a bare LaTeX/plain-maths relation found inside prose with `$...$`."""
    return f'${prose}$'


# --- MDX frontmatter editing -------------------------------------------------

FRONTMATTER_RE = re.compile(r'\A---\n(.*?)\n---\n?(.*)\Z', re.S)
KEY_LINE_RE = re.compile(r'^(?P<indent>\s*)(?P<key>-?\s*[A-Za-z_][A-Za-z0-9_]*):\s*(?P<value>.*?)\s*$')


def split_mdx(text: str) -> tuple[str, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        raise ValueError('not an MDX document with frontmatter')
    return match.group(1), match.group(2)


def join_mdx(frontmatter: str, body: str) -> str:
    if not body.strip():
        return f'---\n{frontmatter}\n---\n'
    return f'---\n{frontmatter}\n---\n\n{body.strip()}\n'


def encode_scalar(value) -> str:
    """Encode a Python value as the inline JSON scalar the content files use."""
    return json.dumps(value, ensure_ascii=False)


def parsed_value(raw: str):
    raw = raw.strip()
    if raw.startswith('- '):
        raw = raw[2:].strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw.strip('"\'')


class FrontmatterLines:
    """Line-oriented view of a frontmatter block.

    The generated content files store every scalar as an inline JSON string on
    one line, so replacing that line keeps the diff small and the YAML valid.
    Multi-line scalars are reported as unsupported rather than silently mangled.
    """

    def __init__(self, frontmatter: str):
        self.lines = frontmatter.split('\n')

    def __str__(self) -> str:
        return '\n'.join(self.lines)

    def entries(self):
        for index, line in enumerate(self.lines):
            match = KEY_LINE_RE.match(line)
            if not match:
                continue
            indent = len(match.group('indent').replace('- ', '  '))
            key = match.group('key').lstrip('- ').strip()
            yield index, indent, key, match.group('value'), line

    def set_line(self, index: int, value) -> None:
        match = KEY_LINE_RE.match(self.lines[index])
        if not match:
            raise ValueError(f'line {index} is not a key/value line')
        prefix = match.group('indent') + match.group('key') + ':'
        self.lines[index] = f'{prefix} {encode_scalar(value)}'

    def find(self, key: str, indent: int = 0):
        return [index for index, ind, k, _, _ in self.entries() if k == key and ind == indent]


# --- Plain-text maths in prose ----------------------------------------------

# Two-letter element symbols. Prose inference must not read `Ca^{2+}` as
# C with a subscript "a" carrying a charge.
ELEMENTS = {
    'He', 'Li', 'Be', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'Cl', 'Ar', 'Ca', 'Sc', 'Ti',
    'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'As', 'Se', 'Br', 'Kr', 'Rb',
    'Sr', 'Zr', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te',
    'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy',
    'Ho', 'Er', 'Tm', 'Yb', 'Lu', 'Hf', 'Ta', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
    'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'Np', 'Pu',
    'Ge', 'No', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'U', 'W',
}

BANGLA_DIGITS = str.maketrans('০১২৩৪৫৬৭৮৯', '0123456789')

# A token belongs to a relation when it carries maths punctuation or a symbol
# that never appears in Bangla/English prose.
_MATH_TOKEN = re.compile(
    r'^[A-Za-z0-9\u09E6-\u09EF'
    r'\[\](){}^_/\\+\-*=\.,;:\'’'
    r'²³⁴⁵⁰¹⁶⁷⁸⁹₀₁₂₃₄'
    r'αβγδεζηθκλμνξπρστυφχψωΓΔΘΛΠΣΦΨΩ'
    r'ẋẍẏÿǎȧ'
    r'∂√≈≠≤≥<>±×·∝∞−–→∑∫°%]{2,}\.?$'
)
_RELATION_MARK = re.compile(r'[=≈<>∝≤≥]')
_HAS_MATH_CHAR = re.compile(r'[/^_()\[\]=≈∝²³⁴⁰¹∂√×−+*\\]|\\[A-Za-z]|\d[A-Za-z]|[A-Za-z]\d')
_PROSE_STOPWORDS = {
    'and', 'or', 'the', 'of', 'to', 'in', 'is', 'are', 'for', 'with', 'when', 'where',
    'that', 'this', 'from', 'at', 'as', 'by', 'on', 'if', 'it', 'be', 'not', 'but',
}


def _is_math_token(token: str, require_mark: bool = False) -> bool:
    stripped = token.strip('.,;:।?!')
    if not stripped or stripped.lower() in _PROSE_STOPWORDS:
        return False
    if re.search(r'[\u0980-\u09FF]', stripped):
        # Bangla words are prose; a Bangla numeral inside a relation is allowed
        # only when the token also carries maths punctuation.
        if not _RELATION_MARK.search(stripped) and not _HAS_MATH_CHAR.search(stripped):
            return False
        return bool(_MATH_TOKEN.match(stripped.translate(BANGLA_DIGITS)))
    if not _MATH_TOKEN.match(stripped):
        return False
    if require_mark:
        return bool(_RELATION_MARK.search(stripped))
    return bool(_HAS_MATH_CHAR.search(stripped))


def wrap_plain_maths(prose: str, max_length: int = 40) -> str:
    """Put `$...$` around bare symbolic relations left inside prose.

    Authors of the generated entries wrote relations as unicode text
    (`−d[A]/dt=k[A]²`, `Y=FL/(AΔL)`), which reads as noise next to the typeset
    mathematics on the same page. Wrapping is all-or-nothing per field: if any
    candidate would have to be restructured in a way that could change its
    meaning (parenthesised numbers, `^(...)` groups, over-long runs) the whole
    field is left exactly as authored, so a sentence never mixes typeset and
    plain relations.
    """
    if '$' in prose:
        return prose
    tokens = prose.split(' ')
    anchors = [index for index, token in enumerate(tokens) if _is_math_token(token, require_mark=True)]
    if not anchors:
        return prose

    spans: list[tuple[int, int]] = []
    for anchor in anchors:
        start = anchor
        while start - 1 >= 0 and _is_math_token(tokens[start - 1]):
            start -= 1
        end = anchor
        while end + 1 < len(tokens) and _is_math_token(tokens[end + 1]):
            end += 1
        if spans and start <= spans[-1][1]:
            spans[-1] = (spans[-1][0], max(spans[-1][1], end))
        else:
            spans.append((start, end))

    planned: list[tuple[int, int, str]] = []
    for start, end in spans:
        fragment = ' '.join(tokens[start:end + 1])
        trailing = ''
        while fragment and fragment[-1] in '.,;:।?!':
            trailing = fragment[-1] + trailing
            fragment = fragment[:-1]
        leading = ''
        while fragment and fragment[0] in '.,;:':
            leading += fragment[0]
            fragment = fragment[1:]
        if not fragment or len(fragment) > max_length or not _RELATION_MARK.search(fragment):
            return prose
        if re.search(r'\^\(|_\(|\(\s*[-+]?[0-9][0-9.]*\s*\)', fragment):
            return prose
        latex = normalise_latex(fragment.translate(BANGLA_DIGITS), prose=True)
        if not latex or latex.count('{') != latex.count('}') or latex != latex.strip():
            return prose
        planned.append((start, end, f'{leading}${latex}${trailing}'))

    for start, end, replacement in reversed(planned):
        tokens[start:end + 1] = [replacement]
    return ' '.join(tokens)
