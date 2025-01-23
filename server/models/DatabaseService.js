const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');
const firebase = require('../config/firebaseconfig');

class DatabaseService {
  constructor() {
    this.db = getFirestore(firebase);
    this.eventsCollection = collection(this.db, 'events');
  }

  async isEventsExists(startDate, endDate) {
    try {
      // Fetch events within the given timeframe
      const eventsSnapshot = await getDocs(
        query(
          this.eventsCollection,
          where('datetime', '>=', startDate.format()),
          where('datetime', '<=', endDate.format())
        )
      );

      // Return true if event exists
      return !eventsSnapshot.empty;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEventsInDateTime(slotsToCheck) {
    try {
      const eventsSnapshot = await getDocs(
        query(
          this.eventsCollection,
          where('datetime', 'in', slotsToCheck.map((slot) => slot.datetime.format()))
        )
      );

      return !eventsSnapshot.empty;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }


  async getEvents(startDate, endDate) {
    try {
      const eventsSnapshot = await getDocs(
        query(
          this.eventsCollection,
          where('datetime', '>=', startDate.format()),
          where('datetime', '<=', endDate.format())
        )
      );
      return eventsSnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      const eventRef = await addDoc(this.eventsCollection, eventData);
      return eventRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
