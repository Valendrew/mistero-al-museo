import React, { useState } from 'react';
import { Container, Form, Row, Col } from 'react-bootstrap';

function aumentaValore(index, valoreAttuale, setValue) {
	let oldVal = valoreAttuale;
	let valToMod = parseInt(valoreAttuale[index]);
	if (valToMod === 9) valToMod = 0;
	else valToMod++;
	oldVal = oldVal.substr(0, index) + valToMod.toString() + oldVal.substring(index + 1);
	setValue(oldVal);
}

function decrementaValore(index, valoreAttuale, setValue) {
	let oldVal = valoreAttuale;
	let valToMod = parseInt(valoreAttuale[index]);
	if (valToMod === 0) valToMod = 9;
	else valToMod--;
	oldVal = oldVal.substr(0, index) + valToMod.toString() + oldVal.substring(index + 1);
	setValue(oldVal);
}

function UpArrow(props) {
	return (
		<svg
			onClick={() => aumentaValore(props.index, props.valoreAttuale, props.setValue)}
			width='30'
			height='30'
			class='bi bi-arrow-up-circle-fill'
			viewBox='0 0 16 16'
			style={{ marginRight: '12px', marginTop: '5px' }}>
			<path d='M16 8A8 8 0 1 0 0 8a8 8 0 0 0 16 0zm-7.5 3.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z' />
		</svg>
	);
}
function DownArrow(props) {
	return (
		<svg
			onClick={() => decrementaValore(props.index, props.valoreAttuale, props.setValue)}
			width='30'
			height='30'
			class='bi bi-arrow-down-circle-fill'
			viewBox='0 0 16 16'
			style={{ marginRight: '12px', marginBottom: '5px' }}>
			<path d='M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z' />
		</svg>
	);
}

function InputNumerico(props) {
	const [value, setValue] = useState('0000');
	return (
		<Container className='bg-secondary' style={{ width: '18%', borderRadius: '15px', padding:"auto"}}>
			<Row style={{paddingLeft:"5%"}}>
				<Col>
					<UpArrow index={0} valoreAttuale={value} setValue={setValue} />
					<UpArrow index={1} valoreAttuale={value} setValue={setValue} />
					<UpArrow index={2} valoreAttuale={value} setValue={setValue} />
					<UpArrow index={3} valoreAttuale={value} setValue={setValue} />
				</Col>
			</Row>
			<Row style={{paddingLeft:"5%"}}>
				<Col>
					<Form.Control readOnly value={value} className='mt-3 mb-3 bg-secondary' style={{letterSpacing: "30px", fontSize:"20px", border:"0px", color:"limegreen"}}/>
				</Col>
			</Row>
			<Row style={{paddingLeft:"5%"}}>
				<Col>
					<DownArrow index={0} valoreAttuale={value} setValue={setValue} />
					<DownArrow index={1} valoreAttuale={value} setValue={setValue} />
					<DownArrow index={2} valoreAttuale={value} setValue={setValue} />
					<DownArrow index={3} valoreAttuale={value} setValue={setValue} />
				</Col>
			</Row>
		</Container>
	);
}

export default InputNumerico;