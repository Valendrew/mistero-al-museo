import React from "react";
import ListGroup from "react-bootstrap/ListGroup";

import ActivityOverview from "./ActivityOverview";
function ChildrenCard(props) {
	return (
		<ListGroup className="mt-2" variant="flush">
			{props.missions[props.activityNmb]
				.filter(
					(val, key) => val !== "" && val !== "new_mission" && val !== props.activityNmb && props.missions[props.activityNmb].indexOf(val) === key
				)
				.map((val) => (
					<ActivityOverview key={`${props.selPrefix}_a${val}`} {...props} selPrefix={`${props.selPrefix}_a${val}`} activityNmb={val} />
				))}
		</ListGroup>
	);
}

export default ChildrenCard;
