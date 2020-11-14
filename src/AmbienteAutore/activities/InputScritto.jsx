import React from "react";
import { Form, Col, Row } from "react-bootstrap";

export default function InputScritto(props) {
	return (
		<Row>
			<Col>
				<Form.Control
					as="textarea"
					cols={80}
					rows={4}
					name={props.id}
					value={props.value}
					onChange={(e) =>
						props.handleInput(e.target.value, props.id)
					}></Form.Control>
			</Col>
		</Row>
	);
}