document.addEventListener('DOMContentLoaded', () => {
    // Navigation logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const toolContents = document.querySelectorAll('.tool-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            toolContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const showResult = (elementId, lines, isError = false) => {
        const resEl = document.getElementById(elementId);
        resEl.innerHTML = '';
        lines.forEach((line, index) => {
            const p = document.createElement('p');
            p.className = 'result-line';
            if (isError) {
                p.classList.add('error');
            } else if (index === lines.length - 1 && lines.length > 1 && line.startsWith('Result:')) {
                p.classList.add('highlight');
            } else if (lines.length === 1 && !line.startsWith('Step:')) {
                p.classList.add('highlight');
            }
            p.innerHTML = line;
            resEl.appendChild(p);
        });
        resEl.classList.add('show');
    };

    // --- Math Functions ---
    const extendedGCD = (a, b) => {
        let old_r = a, r = b;
        let old_s = 1, s = 0;
        let old_t = 0, t = 1;

        while (r !== 0) {
            let quotient = Math.floor(old_r / r);
            let temp_r = r; r = old_r - quotient * r; old_r = temp_r;
            let temp_s = s; s = old_s - quotient * s; old_s = temp_s;
            let temp_t = t; t = old_t - quotient * t; old_t = temp_t;
        }
        return { gcd: old_r, x: old_s, y: old_t }; // old_r = a*x + b*y
    };

    const modInverse = (a, m) => {
        let { gcd, x } = extendedGCD(a, m);
        if (gcd !== 1) return null;
        return ((x % m) + m) % m;
    };

    const modExp = (base, exp, mod) => {
        if (mod === 1) return 0;
        let result = 1;
        base = ((base % mod) + mod) % mod;
        while (exp > 0) {
            if (exp % 2 === 1) result = (result * base) % mod;
            exp = Math.floor(exp / 2);
            base = (base * base) % mod;
        }
        return result;
    };

    // --- Event Listeners ---

    // 1. GCD & Ext-GCD
    document.getElementById('btn-calc-gcd').addEventListener('click', () => {
        const a = parseInt(document.getElementById('gcd-a').value);
        const b = parseInt(document.getElementById('gcd-b').value);
        if (isNaN(a) || isNaN(b)) return showResult('res-gcd', ['Please enter valid numbers'], true);

        const { gcd, x, y } = extendedGCD(Math.abs(a), Math.abs(b));

        const lines = [
            `Calculating GCD(${a}, ${b})...`,
            `Using Extended Euclidean Algorithm:`,
            `${a}(${x}) + ${b}(${y}) = ${gcd}`,
            `Result: GCD is ${gcd}`
        ];

        if (gcd === 1) {
            const invA = modInverse(a, b);
            if (invA !== null) lines.push(`Multiplicative inverse of ${a} mod ${b} is ${invA}`);
        }
        showResult('res-gcd', lines);
    });

    // 2. Modular Arithmetic
    document.getElementById('btn-calc-mod').addEventListener('click', () => {
        const a = parseInt(document.getElementById('mod-a').value);
        const b = parseInt(document.getElementById('mod-b').value);
        const m = parseInt(document.getElementById('mod-m').value);
        const op = document.getElementById('mod-op').value;

        if (isNaN(a) || isNaN(m)) return showResult('res-mod', ['Please provide at least a value for "a" and modulo "m".'], true);
        if (m <= 0) return showResult('res-mod', ['Modulo (m) must be > 0.'], true);

        let res;
        let bVal = isNaN(b) ? 0 : b;

        let cleanA = ((a % m) + m) % m;
        let cleanB = ((bVal % m) + m) % m;

        switch (op) {
            case '+': res = (cleanA + cleanB) % m; break;
            case '-': res = ((cleanA - cleanB) % m + m) % m; break;
            case '*': res = (cleanA * cleanB) % m; break;
            case '^':
                if (bVal < 0) return showResult('res-mod', ['Negative exponent unsupported.'], true);
                res = modExp(a, bVal, m);
                break;
        }
        showResult('res-mod', [`Result: ${a} ${op} ${isNaN(b) ? '' : b} ≡ <strong>${res}</strong> (mod ${m})`]);
    });

    // 3. Linear Congruence
    document.getElementById('btn-calc-lc').addEventListener('click', () => {
        let a = parseInt(document.getElementById('lc-a').value);
        let b = parseInt(document.getElementById('lc-b').value);
        const m = parseInt(document.getElementById('lc-m').value);

        if (isNaN(a) || isNaN(b) || isNaN(m) || m <= 0) return showResult('res-lc', ['Please enter valid numbers (m > 0).'], true);

        const origA = a, origB = b;
        a = ((a % m) + m) % m;
        b = ((b % m) + m) % m;

        const { gcd } = extendedGCD(a, m);
        if (b % gcd !== 0) {
            return showResult('res-lc', [`Result: No solution. gcd(${origA}, ${m}) = ${gcd}, and ${gcd} does not divide ${origB}.`], true);
        }

        const a_prime = a / gcd;
        const b_prime = b / gcd;
        const m_prime = m / gcd;

        const inv = modInverse(a_prime, m_prime);
        const x0 = (b_prime * inv) % m_prime;

        let sols = [];
        for (let i = 0; i < gcd; i++) {
            sols.push((x0 + i * m_prime) % m);
        }
        sols.sort((a, b) => a - b);

        showResult('res-lc', [
            `Solving: ${origA}x ≡ ${origB} (mod ${m})`,
            `gcd(${a}, ${m}) = ${gcd}. Since ${gcd} divides ${b}, there are ${gcd} solutions modulo ${m}.`,
            `Result: x ≡ ${sols.join(', ')} (mod ${m})`
        ]);
    });

    // 4. CRT Solver
    document.getElementById('btn-add-crt-row').addEventListener('click', () => {
        const container = document.getElementById('crt-inputs-container');
        const count = container.children.length + 1;
        const row = document.createElement('div');
        row.className = 'input-row crt-row';
        row.innerHTML = `
            <div class="input-field"><label>a_{sub}</label><input type="number" class="crt-a" placeholder="Remainder" required></div>
            <div class="input-field"><label>m_{sub}</label><input type="number" class="crt-m" placeholder="Modulus" required></div>
            <button class="remove-btn" style="background: transparent; border: none; color: #ef4444; font-size: 1.5rem; cursor: pointer; padding-bottom: 0.5rem;" aria-label="Remove">&times;</button>
        `.replace(/{sub}/g, count);

        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
        container.appendChild(row);
    });

    document.getElementById('btn-calc-crt').addEventListener('click', () => {
        const rows = document.querySelectorAll('.crt-row');
        const eqs = [];
        for (let row of rows) {
            const a = parseInt(row.querySelector('.crt-a').value);
            const m = parseInt(row.querySelector('.crt-m').value);
            if (isNaN(a) || isNaN(m) || m <= 0) return showResult('res-crt', ['Please fill all fields correctly (Moduli > 0).'], true);
            eqs.push({ a: ((a % m) + m) % m, m });
        }

        // Check pairwise coprimality
        for (let i = 0; i < eqs.length; i++) {
            for (let j = i + 1; j < eqs.length; j++) {
                if (extendedGCD(eqs[i].m, eqs[j].m).gcd !== 1) {
                    return showResult('res-crt', [`Moduli ${eqs[i].m} and ${eqs[j].m} are not coprime. Implementation only supports coprime moduli.`], true);
                }
            }
        }

        let M = eqs.reduce((acc, eq) => acc * eq.m, 1);
        let result = 0;
        let lines = [`Solving system of ${eqs.length} congruences...`, `Total Modulus M = ${M}`];

        for (let i = 0; i < eqs.length; i++) {
            let eq = eqs[i];
            let Mi = M / eq.m;
            let yi = modInverse(Mi, eq.m);
            result = (result + eq.a * Mi * yi) % M;
            lines.push(`Equation ${i + 1}: M_${i + 1} = ${Mi}, y_${i + 1} (inv of M_${i + 1} mod ${eq.m}) = ${yi}`);
        }

        result = (result % M + M) % M;
        lines.push(`Result: x ≡ ${result} (mod ${M})`);

        showResult('res-crt', lines);
    });
});
