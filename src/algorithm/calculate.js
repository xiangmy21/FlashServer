import { Orders } from '../middlewares/mongo.js';

const map_room = {
  "B569": { floor: "5", pose: { pose: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 0} } }, room_id: "B569" },
}

const floorDistance = 100;
function calc_distance(carPose, room) {
  const roomPose = map_room[room];
  return (carPose.floor != roomPose.floor ? 1 : 0) * floorDistance + 
    Math.abs(carPose.pose.pose.position.x - roomPose.pose.pose.position.x) + 
    Math.abs(carPose.pose.pose.position.y - roomPose.pose.pose.position.y);
}
function time_convert(time) {
  const date = new Date(time);
  return Math.floor(date.getTime()/1000);
}

// Function to calculate the goal
// return type: { order: object, roomPose: {floor: string, pose: object, room_id: string} }
const runningTypes = ["run_to_get", "arrive_at_get", "run_to_send"];
const startTypes = ["queueing", "run_to_get"];
const endTypes = ["arrive_at_get", "run_to_send"];
export async function calculate_goal(carPose) {
  let candidateGoals = [];
  for ( let i = 0; i < 3; i++) {
    const running = await Orders.findOne({ door: i, status: { $in: runningTypes } });
    if (running) {
      candidateGoals.push(running);
    }
    else {
      // find the earliest queueing order, according to time_start
      const options = { sort: { time_start: 1 } };
      const queueing = await Orders.findOne({ door: i, status: "queueing" }, options);
      if (queueing) {
        candidateGoals.push(queueing);
      }
    }
  }
  if (candidateGoals.length == 0) {
    return null;
  }

  // Sort the candidate goals based on priority rules
  const TimeWeight = 0.5;
  const DistanceWeight = 1;
  const StartWeight = -50;
  candidateGoals.sort((A, B) => {
    if (startTypes.includes(A.status) && startTypes.includes(B.status)) {
      return time_convert(A.time_start) - time_convert(B.time_start);
    }
    else if (endTypes.includes(A.status) && endTypes.includes(B.status)) {
      const time = time_convert(A.time_start) - time_convert(B.time_start);
      const distance = calc_distance(carPose, A.room_end) - calc_distance(carPose, B.room_end);
      return time*TimeWeight + distance*DistanceWeight;
    }
    else if (startTypes.includes(A.status) && endTypes.includes(B.status)) {
      const time = time_convert(A.time_start) - time_convert(B.time_start);
      const distance = calc_distance(carPose, A.room_start) - calc_distance(carPose, B.room_end);
      return time*TimeWeight + distance*DistanceWeight + StartWeight;
    }
    else if (endTypes.includes(A.status) && startTypes.includes(B.status)) {
      const time = time_convert(A.time_start) - time_convert(B.time_start);
      const distance = calc_distance(carPose, A.room_end) - calc_distance(carPose, B.room_start);
      return time*TimeWeight + distance*DistanceWeight - StartWeight;
    }
  });
  const res = candidateGoals[0];
  if (startTypes.includes(res.status)) {
    return { order: res, roomPose: map_room[res.room_start] };
  }
  else {
    return { order: res, roomPose: map_room[res.room_end] };
  }
}