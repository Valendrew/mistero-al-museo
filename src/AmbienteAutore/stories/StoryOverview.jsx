import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { DataSet, Network } from 'vis-network/standalone/esm/vis-network';
import QRCode from 'qrcode.react';

import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { DropdownButton, InputGroup, ButtonGroup, Dropdown, Row, Col } from 'react-bootstrap';

const createNodes = (activities, missions) => {
	return Object.keys(activities)
		.map(value => {
			return { id: `a_${value}`, label: `Attività ${value}` };
		})
		.concat(
			Object.keys(missions).map(value => {
				return { id: `m_${value}`, label: `Missione ${value}` };
			})
		);
};

const createEdges = (missions, transitions) => {
	let edges = [];
	Object.entries(missions).forEach(([key, value]) => {
		Object.entries(value).forEach(([k, v]) => {
			let newEdge = null;
			if (Array.isArray(v)) {
				v.forEach(act => {
					if (act === 'new_mission') {
						const misTr = transitions.indexOf(key);
						if (misTr + 1 < transitions.length)
							newEdge = { from: `a_${k}`, to: `m_${transitions[misTr + 1]}` };
					} else newEdge = { from: `a_${k}`, to: `a_${act}` };

					if (
						newEdge !== null &&
						!edges.some(value => value.from === newEdge.from && value.to === newEdge.to)
					) {
						edges.push(newEdge);
					}
					newEdge = null;
				});
			} else {
				newEdge = { from: `m_${key}`, to: `a_${v}` };
				if (!edges.some(value => value.from === newEdge.from && value.to === newEdge.to)) {
					edges.push(newEdge);
				}
			}
		});
	});
	return edges;
};

function StoryGraph({ story, transitions, index }) {
	const domNode = useRef(null);
	const network = useRef(null);

	useEffect(() => {
		const nodes = new DataSet(createNodes(story.activities, story.missions));
		const edges = new DataSet(createEdges(story.missions, transitions));
		const layout = {
			hierarchical: {
				enabled: true,
				direction: 'RL',
				levelSeparation: 110,
				nodeSpacing: 300
			}
		};
		const options = {
			autoResize: true,
			height: '100%',
			width: '100%',
			locale: 'it',
			edges: {
				arrows: 'to'
			},
			layout: layout,
			interaction: {
				dragNodes: true
			}
		};

		const data = {
			nodes,
			edges
		};
		network.current = new Network(domNode.current, data, options);
	}, [story, transitions]);

	return (
		<Row className='my-4'>
			<Col>
				<Card>
					<Card.Header>Grafo delle storie (Transizione {index})</Card.Header>
					<Card.Body>
						<div style={{ height: '400px' }} ref={domNode} />
					</Card.Body>
				</Card>
			</Col>
		</Row>
	);
}

function StoryQRCode(props) {
	return (
		<Row className='my-4'>
			<Col>
				<Card>
					<Card.Header>QRCode</Card.Header>
					{props.value ? (
						<>
							<Card.Body>
								<QRCode value={props.value} />
							</Card.Body>
							<Card.Footer>
								<Button variant='primary' onClick={props.removeQRCode}>
									Ritira
								</Button>
							</Card.Footer>
						</>
					) : (
						<Card.Body>
							<Button variant='primary' onClick={props.generateQRCode}>
								Genera QRCode
							</Button>
						</Card.Body>
					)}
				</Card>
			</Col>
		</Row>
	);
}

function StoryPropertyCard(props) {
	return (
		<Row className='my-4'>
			<Col>
				<Card>
					<Card.Header>{props.title}</Card.Header>
					<Form onSubmit={e => props.onSubmit(e, props.inputName)}>
						<Card.Body>
							<InputGroup>
								<Form.Control
									value={props.input || ''}
									as={props.as}
									type='text'
									rows='4'
									onChange={e => props.onChange(e.target.value, props.inputName)}
								/>
								<InputGroup.Append>
									<Button variant='primary' type='submit'>
										Modifica
									</Button>
								</InputGroup.Append>
							</InputGroup>
						</Card.Body>
					</Form>
				</Card>
			</Col>
		</Row>
	);
}

function StoryOverview() {
	let history = useHistory();
	const idStory = history.location.state.idStory;

	const [story, setStory] = useState({ error: null, isLoaded: false, items: {} });
	const [storyCompleted, setStoryCompleted] = useState(false);
	const [inputs, setInputs] = useState({
		name: undefined,
		description: undefined
	});

	useEffect(() => {
		const fetchData = async () => {
			const result = await fetch(`/stories/${idStory}`, {
				method: 'GET'
			});
			// Se la richiesta non è andata a buon fine
			if (!result.ok) setStory({ isLoaded: true, error: result.statusText });
			else {
				const data = await result.json();
				setStory({
					isLoaded: true,
					items: data
				});
				setInputs({
					name: data.info.name || '',
					description: data.info.description || ''
				});
				if (data.activities && data.missions) {
					setStoryCompleted(true);
				}
			}
		};
		if (!story.isLoaded) fetchData();
	}, [idStory, story]);

	const onSubmit = (e, type) => {
		e.preventDefault();
		fetch(`/stories/${idStory}/${type}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'text/plain' },
			body: inputs[type]
		})
			.then(res => setStory({ error: null, isLoaded: false, items: [] }))
			.catch(console.log);
	};

	const generateQRCode = () => {
		fetch(`/stories/${idStory}/qrcode`, {
			method: 'POST'
		})
			.then(res => setStory({ error: null, isLoaded: false, items: [] }))
			.catch(console.log);
	};

	const removeQRCode = () => {
		fetch(`/stories/${idStory}/qrcode`, {
			method: 'DELETE'
		})
			.then(res => setStory({ error: null, isLoaded: false, items: [] }))
			.catch(console.log);
	};

	const handleEditStory = e => {
		if (e.target.name === 'missions')
			history.push('missions', { idStory: idStory, action: 'edit' });
		else if (e.target.name === 'activities') history.push('activities', { idStory: idStory });
		else if (e.target.name === 'transitions')
			history.push('conclusion', { idStory: idStory, action: 'edit' });
	};

	const handleRetrieveStory = e => {
		let numberActivity = 0;
		if (story.items.activities) {
			numberActivity = Object.keys(story.items.activities).length;
		}
		history.push('activity', { idStory: idStory, idActivity: numberActivity });
	};

	const handleDuplicateStory = async e => {
		const result = await fetch(`/stories/${idStory}`, {
			method: 'POST'
		});
		if (!result.ok) console.log(result.statusText);
		else history.replace('/autore');
	};

	const handleDeleteStory = async e => {
		const result = await fetch(`/stories/${idStory}`, {
			method: 'DELETE'
		});
		if (!result.ok) console.log(result.statusText);
		else history.replace('/autore');
	};

	return story.isLoaded ? (
		story.error ? (
			<h5>Errore nel caricamento, ricaricare</h5>
		) : (
			<>
				<StoryPropertyCard
					title={'Nome'}
					inputName={'name'}
					input={inputs.name}
					as={'input'}
					onSubmit={onSubmit}
					onChange={(value, name) => setInputs({ ...inputs, [name]: value })}
				/>
				<StoryPropertyCard
					title={'Descrizione'}
					inputName={'description'}
					input={inputs.description}
					as={'textarea'}
					onSubmit={onSubmit}
					onChange={(value, name) => setInputs({ ...inputs, [name]: value })}
				/>

				{story.items.transitions && Object.keys(story.items.activities).length >= 10 ? (
					<>
						<StoryQRCode
							value={story.items.info.qr}
							removeQRCode={removeQRCode}
							generateQRCode={generateQRCode}
						/>
						{story.items.transitions.map((value, key) => (
							<StoryGraph key={key} index={key} story={story.items} transitions={value} />
						))}
					</>
				) : null}

				<Row>
					{story.items.activities && Object.keys(story.items.activities).length >= 10 ? (
						<Col className='d-flex justify-content-start'>
							<ButtonGroup>
								<DropdownButton as={ButtonGroup} title='Modifica storia'>
									<Dropdown.Item eventKey='1' name='activities' onClick={handleEditStory}>
										Modifica attività
									</Dropdown.Item>
									<Dropdown.Item eventKey='2' name='missions' onClick={handleEditStory}>
										Modifica missioni
									</Dropdown.Item>
									{storyCompleted ? (
										<>
											<Dropdown.Item eventKey='3' name='transitions' onClick={handleEditStory}>
												Modifica impostazioni della storia
											</Dropdown.Item>
										</>
									) : null}
								</DropdownButton>
							</ButtonGroup>
						</Col>
					) : (
						<Col className='d-flex justify-content-start'>
							<Button name='retrieveStory' onClick={handleRetrieveStory}>
								Continua a creare la storia
							</Button>
						</Col>
					)}
					<Col className='d-flex justify-content-end'>
						<ButtonGroup>
							<DropdownButton as={ButtonGroup} title='Gestisci storia'>
								<Dropdown.Item eventKey='1' name='duplicateStory' onClick={handleDuplicateStory}>
									Crea una copia della storia
								</Dropdown.Item>
								<Dropdown.Item eventKey='2' name='deleteStory' onClick={handleDeleteStory}>
									Archivia la storia
								</Dropdown.Item>
							</DropdownButton>
						</ButtonGroup>
					</Col>
				</Row>
			</>
		)
	) : (
		<h5>Loading...</h5>
	);
}

export default StoryOverview;
