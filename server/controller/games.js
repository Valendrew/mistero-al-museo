const express = require('express');
const path = require('path');
const uuidv4 = require('uuid').v4;
const uuidValidate = require('uuid').validate;
const fileOperations = require('./methods');

const app = express();
app.set('games', path.join(__dirname, '..', 'data', 'games'));
app.set('stories', path.join(__dirname, '..', 'data', 'stories'));

const router = express.Router();
router.use(express.json());
router.use(express.text());

router.use((req, res, next) => {
	console.log(
		`Request ${req.method} at /games${req.path} on Time: ${new Date(Date.now()).toUTCString()}`
	);
	next();
});

/* Richieste per ottenere i player di una determinata storia */
router.get('/:id/players', async (req, res, next) => {
	const storyID = req.params.id;
	let result;
	try {
		result = await fileOperations.read('player.json', app.get('games'));
	} catch (e) {
		result = {};
	}
	res.send(result[storyID] || {});
});

//Per ottenere tutte le risposte date dal giocatore
router.get('/:playerId/:storyId/playerAnswers', async (req, res, next) => {
	const playerID = req.params.playerId;
	const storyID = req.params.storyId;
	let result;
	try {
		result = await fileOperations.read('player.json', app.get('games'));
	} catch (e) {
		result = {};
	}
	res.send(
		{
			answers: result[storyID][playerID].givenAnswer || {},
			name: result[storyID][playerID].name
		} || {}
	);
});

const updateStatusPlayer = async (req, res, next) => {
	const playerID = res.locals.playerID;
	const storyID = req.params.id;
	const playerStatus = req.body;

	let data = {};
	try {
		data = await fileOperations.read('player.json', app.get('games'));
	} catch (e) {
		data = {};
	}

	if (data.hasOwnProperty(storyID)) {
		if (playerStatus.hasOwnProperty('name')) {
			playerStatus.name = 'player' + Object.keys(data[storyID]).length;
		}

		data[storyID][playerID] = { ...data[storyID][playerID], ...playerStatus };
	} else {
		if (playerStatus.hasOwnProperty('name')) {
			playerStatus.name = 'player0';
		}

		data[storyID] = { [playerID]: playerStatus };
	}

	fileOperations
		.write(data, 'player.json', app.get('games'))
		.then(() => {
			res.send(res.locals.response || 'status updated');
		})
		.catch(next);
};

/* Richiesta per creare l'identità del player */
router.post(
	'/:id',
	async (req, res, next) => {
		/* Controllo se l'ID passato come parametro alla richiesta
		rispetta il formato uuid */
		const uuidParam = req.params.id;
		if (uuidValidate(uuidParam)) {
			/* Leggo il file contenente le informazioni di tutte le storie (id e user) */
			let storiesFile;
			try {
				storiesFile = await fileOperations.read('stories.json', app.get('stories'));
			} catch (e) {
				next(e);
			}

			/* Seleziono l'utente della storia selezionata, se esiste allora
			leggo il file contenente l'intera storia nella subdirectory dell'utente */
			const { user } = storiesFile[uuidParam];
			if (user) {
				/* Leggo il file relativo alla storia passata come ID, 
				selezionando la transizione iniziale per il player. La transizione
				viene selezionata casualmente partendo dal numero delle
				transizioni presenti nella storia */
				let storyFile, startTransition;
				try {
					storyFile = await fileOperations.read(
						`story_${uuidParam}.json`,
						path.join(app.get('stories'), user)
					);
					startTransition = Math.floor(Math.random() * Object.keys(storyFile.transitions).length);
				} catch (e) {
					next(e);
				}

				/* Lo stato iniziale del player sarà strutturato come un 
				oggetto in cui la prima chiave identifica lo stato
				dell'attività corrente, la seconda le informazioni relative
				alla storia, come la transizione selezionata e la data di inizio */
				const date = new Date();
				const playerStatus = {
					status: {
						activity: 'start',
						score: 0,
						dateActivity: date
					},
					info: {
						transition: startTransition,
						dateStart: date
					},
					name: 'player'
				};

				/* Generato ID del player che verrà inserito all'interno
				del file contenente tutti i player e le storie di cui fanno parte */
				const playerID = uuidv4();

				res.locals.playerID = playerID;
				req.body = playerStatus;
				res.locals.response = { player: playerStatus, story: storyFile };

				res.cookie('playerID', playerID, { httpOnly: true }, { maxAge: '3h' });

				next();
			} else {
				next(new Error('story not valid'));
			}
		} else {
			next(new Error('uuid not valid'));
		}
	},
	updateStatusPlayer
);

let informationsPending = {};

router.get('/informations', (req, res, next) => {
	res.send(informationsPending);
	informationsPending = {};
});

/* Richiesta per aggiornare lo stato del player */
router.put(
	'/:id/players/status',
	(req, res, next) => {
		res.locals.playerID = req.cookies.playerID;

		informationsPending[req.cookies.playerID] = {
			...informationsPending[req.cookies.playerID],
			story: req.params.id,
			status: req.body.status
		};

		if (req.body.status.hasOwnProperty('interval')) {
			res.send('status updated');
		} else next();
	},
	updateStatusPlayer
);

/* Richiesta per aggiornare le risposte del player */
let answersPending = {};
router.put(
	'/:id/players/answers',
	(req, res, next) => {
		res.locals.playerID = req.cookies.playerID;
		answersPending[req.cookies.playerID] = {
			story: req.params.id,
			givenAnswer: req.body.givenAnswer
		};
		next();
	},
	updateStatusPlayer
);

/* Richiesta per richiedere la valutazione della domanda aperta */
router.put(
	'/:id/players/answer',
	(req, res, next) => {
		res.locals.playerID = req.cookies.playerID;

		informationsPending[req.cookies.playerID] = {
			...informationsPending[req.cookies.playerID],
			story: req.params.id,
			answer: req.body.answer
		};
		
		next();
	},
	updateStatusPlayer
);

/* Richiesta per richiedere aiuto per la domanda */
router.put('/:id/players/help', (req, res) => {
	res.locals.playerID = req.cookies.playerID;

	informationsPending[req.cookies.playerID] = {
		...informationsPending[req.cookies.playerID],
		story: req.params.id,
		help: req.body.help
	};

	res.send('help request');
});

/* Richieste per inviare la correzione alla domanda aperta */
let questionsPending = {};

router.get('/:id/players/question', (req, res) => {
	res.send(questionsPending[req.cookies.playerID] || {});
	delete questionsPending[req.cookies.playerID];
});

router.put(
	'/:id/players/:name/question',
	(req, res, next) => {
		res.locals.playerID = req.params.name;
		questionsPending[req.params.name] = req.body.question;
		next();
	},
	updateStatusPlayer
);

/* Richieste per inviare aiuto al player */
/* Richieste per inviare la correzione alla domanda aperta */
let helpPending = {};

router.get('/:id/players/help', (req, res) => {
	res.send(helpPending[req.cookies.playerID] || '');

	delete helpPending[req.cookies.playerID];
});

router.put('/:id/players/:name/help', (req, res) => {
	res.locals.playerID = req.params.name;

	helpPending[req.params.name] = req.body.help;
	res.send('help sent');
});

/* Richiesta per modificare il nome */
router.put(
	'/:id/players/:name/name',
	(req, res, next) => {
		res.locals.playerID = req.params.name;
		next();
	},
	updateStatusPlayer
);

/*Richieste per la chat*/
let chatPendingValutatore = {};
router.get('/chatValutatore', (req, res) => {
	res.send(chatPendingValutatore);
	chatPendingValutatore = {};
});

let chatPendingPlayer = {};
router.get('/chatPlayer', (req, res) => {
	res.send(chatPendingPlayer[req.cookies.playerID] || {});
	delete chatPendingPlayer[req.cookies.playerID];
});

router.put(
	'/:id/message',
	(req, res, next) => {
		res.locals.playerID = req.cookies.playerID;
		chatPendingValutatore[req.cookies.playerID] = { story: req.params.id, chat: req.body.chat };
		next();
	},
	updateStatusPlayer
);

router.put(
	'/:id/message/:name',
	(req, res, next) => {
		res.locals.playerID = req.params.name;
		chatPendingPlayer[req.params.name] = { story: req.params.id, chat: req.body.chat };
		next();
	},
	updateStatusPlayer
);

module.exports = router;
