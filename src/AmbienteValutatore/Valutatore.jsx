import React, { useEffect, useState } from 'react';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import SideBar from './SideBar';
import PlayerInfo from './PlayerInfo';
import useInterval from '../useInterval';
import Ranking from './Ranking';
import NavbarValutatore from './NavbarValutore';
import { Container } from 'react-bootstrap';

function Valutatore() {
	const [stories, setStories] = useState();
	const [players, setPlayers] = useState();
	const [playerSelected, setPlayerSelected] = useState();
	const [inputs, setInputs] = useState();
	const [isLoaded, setIsLoaded] = useState({ loaded: false, error: null });
	const [showRanking, setShowRanking] = useState(false);
	const [storySelected, setStorySelected] = useState();

	const setPlayerDashboard = (idPlayer, informations, idStory) => {
		setPlayerSelected({
			story: idStory,
			informations: informations,
			id: idPlayer
		});
		setInputs({
			name: { value: informations.name, error: false }
		});
	};

	const updateStatus = (idStory, idPlayer, statusUpdated) => {
		/* Ricerco l'indice della storia richiesta */
		const index = stories.findIndex(element => element.info.id === idStory);

		if (index !== -1 && players[index].hasOwnProperty(idPlayer)) {
			let newPlayers = [...players];

			newPlayers[index] = {
				...newPlayers[index],
				[idPlayer]: { ...newPlayers[index][idPlayer], ...statusUpdated }
			};

			const currentPlayer = newPlayers[index][idPlayer];

			if (
				currentPlayer.hasOwnProperty('help') &&
				currentPlayer.help &&
				currentPlayer.help.activity !== currentPlayer.status.activity
			) {
				delete newPlayers[index][idPlayer].help;
			}

			if (playerSelected && playerSelected.id === idPlayer) {
				if (statusUpdated.hasOwnProperty('name')) {
					setInputs({ ...inputs, name: { value: statusUpdated.name, error: false } });
				}
				setPlayerSelected({
					...playerSelected,
					informations: newPlayers[index][idPlayer]
				});
			}

			setPlayers(newPlayers);
		}
	};

	const fetchAnswerCorrection = async (idStory, idPlayer, correct, value, answerPlayer) => {
		const result = await fetch(`/games/${idStory}/players/${idPlayer}/question`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				question: { value: value, correct: correct, answerPlayer: answerPlayer },
				answer: null
			})
		});
		if (result.ok) {
			updateStatus(idStory, idPlayer, { answer: null });
			setInputs({ ...inputs, tipAnswer: undefined, score: undefined });
		}
	};

	const sendHelpToPlayer = async (tip, idStory, idPlayer, activity) => {
		await fetch(`/games/${idStory}/players/${idPlayer}/help`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ help: { tip: tip, activity: activity } })
		});
		updateStatus(idStory, idPlayer, { help: null });
	};

	useInterval(
		async () => {
			const result = await fetch('/games/informations');
			if (result.ok) {
				result.json().then(data => {
					Object.entries(data).forEach(([key, value]) => {
						updateStatus(value.story, key, value);
					});
				});
			}
		},
		isLoaded.loaded ? 10000 : null
	);

	useEffect(() => {
		const fetchData = async () => {
			const storiesRequest = await fetch(`/stories/`);

			if (!storiesRequest.ok)
				setStories({
					isLoaded: true,
					error: storiesRequest.statusText
				});
			else {
				const storiesFetched = await storiesRequest.json(); // stories
				const playersRequested = await Promise.all(
					storiesFetched.map(value => fetch(`/games/${value.info.id}/players`))
				);

				Promise.all(playersRequested.map(res => res.json()))
					.then(playersFetched => {
						setStories(storiesFetched);
						setPlayers(playersFetched);
						setIsLoaded({ loaded: true });
					})
					.catch(e =>
						setStories({
							isLoaded: true,
							error: e.message
						})
					);
			}
		};
		if (!isLoaded.loaded) fetchData();
	}, [isLoaded]);

	useInterval(
		async () => {
			const result = await fetch('/games/chatValutatore');
			if (result.ok) {
				result.json().then(data => {
					Object.entries(data).forEach(([key, value]) => {
						updateStatus(value.story, key, value);
					});
				});
			}
		},
		isLoaded.loaded ? 10000 : null
	);

	return isLoaded.loaded ? (
		isLoaded.error ? (
			<h6>Errore caricamento</h6>
		) : (
			<Container fluid>
				<NavbarValutatore />
				<Row>
					<Col xs={4} style={{ height: 'calc(100vh - 7vh)', overflowY: 'scroll' }}>
						<SideBar
							stories={stories}
							players={players}
							setPlayer={setPlayerDashboard}
							setRanking={setShowRanking}
							setStorySelected={setStorySelected}
						/>
					</Col>
					{showRanking ? (
						<Col xs={8} style={{ height: '100%', overflowY: 'scroll' }}>
							<Ranking players={players} storySelected={storySelected} />
						</Col>
					) : playerSelected ? (
						<Col
							xs={8}
							style={{ height: 'calc(100vh - 7vh)', overflowY: 'scroll' }}>
							<PlayerInfo
								player={playerSelected}
								story={stories.find(element => element.info.id === playerSelected.story)}
								inputs={inputs}
								updateStatus={updateStatus}
								setInputs={setInputs}
								fetchAnswerCorrection={fetchAnswerCorrection}
								sendHelpToPlayer={sendHelpToPlayer}
							/>
						</Col>
					) : null}
				</Row>
			</Container>
		)
	) : null;
}
export default Valutatore;
