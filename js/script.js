class Persona {
    constructor(username, currentTier, tenure, subType) {
        this.username = username;
        this.currentTier = currentTier;
        this.tenure = tenure;
        this.subType = subType;
    }

    esValido() {
        return this.subType.trim() != 'gift';
    }
}

window.participantes = [];
window.participantesPonderados = [];
window.premiosBloqueados = true;

function csvOneLineToParticipantes(csvText) {
    const values = csvText.split('\n').map(row => row.split(','));

    for (let i = 1; i + 1 < values.length; i++) {
        const participante = new Persona(values[i][0], values[i][2], values[i][3], values[i][5]);
        if (participante.esValido()) {
            window.participantes.push(participante);
        }
    }

    // Lista ponderada para la switch2
    window.participantesPonderados = [];
    window.participantes.forEach(p => {
        window.participantesPonderados.push(p);
        if (p.tenure > 3) {
            window.participantesPonderados.push(p);
        }
        if (p.tenure > 11) {
            window.participantesPonderados.push(p);
        }
    });
}

function cambioEscena() {
    document.getElementById("formulario").style.display = "none";
    document.getElementById("sorteo").style.display = "block";
    document.getElementById("snowflakes").style.display = "flex";
    window.premiosBloqueados = false;
};

function getRandomParticipante() {
    if (!window.participantes || window.participantes.length === 0) {
        return null;
    }
    const index = Math.floor(Math.random() * window.participantes.length);
    return window.participantes[index];
}

function getRandomParticipantePonderado() {
    if (!window.participantesPonderados || window.participantesPonderados.length === 0) {
        return null;
    }
    const index = Math.floor(Math.random() * window.participantesPonderados.length);
    return window.participantesPonderados[index];
}

function esperarConfirmacion() {
    return new Promise((resolve) => {
        const give = document.getElementById('give');
        const reroll = document.getElementById('reroll');

        const onGive = () => cleanup(() => resolve('give'));
        const onReroll = () => cleanup(() => resolve('reroll'));

        function cleanup(callback) {
            give.removeEventListener('click', onGive);
            reroll.removeEventListener('click', onReroll);
            callback();
        }

        give.addEventListener('click', onGive);
        reroll.addEventListener('click', onReroll);
    });
}

async function sortear(switch2) {
    let ganador;
    if (switch2) {
        ganador = getRandomParticipantePonderado();
    } else {
        ganador = getRandomParticipante();
    }

    document.getElementById("ganador").textContent = ganador.username;
    document.getElementById("div-titulo").style.display = "none";
    document.getElementById("div-ganador").style.display = "block";

    while (true) {
        const decision = await esperarConfirmacion();

        if (decision === 'give') {
            return ganador.username;
        }

        if (switch2) {
            ganador = getRandomParticipantePonderado();
        } else {
            ganador = getRandomParticipante();
        }

        document.getElementById("ganador").textContent = ganador.username;
    }
}

document.querySelectorAll('.premio').forEach((element) => {
    element.addEventListener('click', async () => {
        if (premiosBloqueados || element.classList.contains('sorteada')) return;

        element.dataset.msg = '¡Sorteando!';
        document.querySelectorAll('.premio').forEach((e) => {
            e.classList.add('no-hover');
        });

        element.classList.add('sorteada');
        premiosBloqueados = true;

        try {
            let ganador = '';
            if (element.id == "switch") {
                ganador = await sortear(true);
            } else {
                ganador = await sortear(false);
            }
            element.dataset.msg = ganador;
            document.querySelectorAll('.premio').forEach((e) => {
                e.classList.remove('no-hover');
            });
            document.getElementById("div-titulo").style.display = "block";
            document.getElementById("div-ganador").style.display = "none";
        } finally {
            premiosBloqueados = false;
        }
    });
});

document.querySelectorAll(".snowflake").forEach((flake) => {
    flake.addEventListener("animationiteration", (e) => {
        if (e.animationName == "snowflakes-shake") return;

        const nameDiv = flake.querySelector(".name");
        if (!nameDiv) return;

        const participante = getRandomParticipante();

        if (!participante) {
            nameDiv.textContent = "";
        } else {
            nameDiv.textContent = participante.username;
        }
    });
});

document.getElementById("csvFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            window.participantes = [];
            const csvText = reader.result;
            csvOneLineToParticipantes(csvText);
            console.log(window.participantes);
            console.log(window.participantesPonderados);
            cambioEscena();

        } catch (err) {
            console.error("Error procesando CSV:", err);
        }
    };
    reader.readAsText(file);
});


