import { Orders } from '../middlewares/mongo.js';

// Function to compare distances between two rooms
function compare_distance(room_A, room_B) {
  // Implement your distance comparison logic here

}

// Function to calculate the goal
// return type: { order: object, roomPose: {floor: string, pose: object, room_id: string} }
export function calculate_goal(carPose) {
  // Get the current unfinished orders
  const unfinishedOrders = Orders.filter(order => 
    order.status === 'queueing' || 
    order.status === 'run_to_get' || 
    order.status === 'success_get' || 
    order.status === 'run_to_send'
  );

  // Initialize an array to store the candidate goals
  const candidateGoals = [];

  // Check if any cabinet is in use
  const cabinetsInUse = unfinishedOrders.some(order => 
    order.status === 'run_to_get' || 
    order.status === 'success_get' || 
    order.status === 'run_to_send'
  );

  // Add orders and their room_start as candidate goals if status is run_to_get
  unfinishedOrders.forEach(order => {
    if (order.status === 'run_to_get') {
      candidateGoals.push({
        order: order,
        room: order.room_start
      });
    }
  });

  // Add orders and their room_end as candidate goals if status is success_get or run_to_send
  unfinishedOrders.forEach(order => {
    if (order.status === 'success_get' || order.status === 'run_to_send') {
      candidateGoals.push({
        order: order,
        room: order.room_end
      });
    }
  });

  // Check if any cabinet is not in use
  const cabinetsNotInUse = [0, 1, 2].filter(cabinet => 
    !unfinishedOrders.some(order => 
      (order.status === 'run_to_get' || 
      order.status === 'success_get' || 
      order.status === 'run_to_send') && 
      order.cabinet === cabinet
    )
  );

  // Find the earliest queueing order for each cabinet not in use
  cabinetsNotInUse.forEach(cabinet => {
    const earliestOrder = unfinishedOrders
      .filter(order => order.status === 'queueing' && order.door === cabinet)
      .reduce((earliest, order) => (order.time_start < earliest.time_start ? order : earliest), { time_start: Infinity });

    if (earliestOrder.time_start !== Infinity) {
      candidateGoals.push({
        order: earliestOrder,
        room: earliestOrder.room_start
      });
    }
  });

  // Sort the candidate goals based on priority rules
  candidateGoals.sort((goalA, goalB) => {
    if (goalA.room === goalB.room) {
      return goalA.order.time_start - goalB.order.time_start;
    } else if (goalA.order.status === 'queueing' && goalB.order.status === 'queueing') {
      return goalA.room - goalB.room;
    } else {
      return compare_distance(goalA.room, goalB.room);
    }
  });

  // Return the calculated goal
  return candidateGoals[0];
}