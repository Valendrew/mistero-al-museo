import React, { useState, useEffect } from "react";

import { useHistory, useRouteMatch } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

import ActivityCard from "./ActivityCard";
import Missions from "./Missions";

function Activities() {
	const [story, setStory] = useState({ error: null, isLoaded: false, items: [] });
	const history = useHistory();
	const match = useRouteMatch("/autore/missions");
	const idStory = 1;

	useEffect(() => {
		fetch(`/story/${idStory}/activities`, {
			method: "GET",
			headers: { Authorization: `Basic ${btoa("user_1:abcd")}`, "Content-Type": "application/json" },
		})
			.then((res) => res.json())
			.then(
				(result) => {
					setStory({
						isLoaded: true,
						items: result,
					});
				},
				(error) => {
					setStory({
						isLoaded: true,
						error,
					});
				}
			);
	}, []);

	const fetchMissions = (missions) => {
		fetch(`/story/${idStory}/missions`, {
			method: "POST",
			headers: { Authorization: `Basic ${btoa("user_1:abcd")}`, "Content-Type": "application/json" },
			body: JSON.stringify(missions),
		}).then((response) => {
			history.push(`${match.url}/transitions`);
		});
	};

	return (
		<Container fluid>
			{story.isLoaded ? (
				<>
					<Row className="row row-cols-4 row-cols-lg-6">
						{story.items.map((value, i) => {
							return <ActivityCard key={i} id={i} storyline={value["storyline"]} />;
						})}
					</Row>
					<Row>
						<Missions activities={story.items} fetchMissions={fetchMissions} />
					</Row>
				</>
			) : (
				<h5>Loading...</h5>
			)}
		</Container>
	);
}

export default Activities;