'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coordinates, distance, duration) {
    this.coordinates = coordinates;
    this.distance = distance; //km
    this.duration = duration; //min
  }
  setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    }
    ${this.date.getDay()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coordinates, distance, duration, cadence) {
    super(coordinates, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coordinates, distance, duration, elevation) {
    super(coordinates, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  constructor() {
    this.#getPosition();
    this.#getLocalStorage();
    // Event listeners
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  #loadMap(position) {
    console.log(position);
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this.#showForm.bind(this));
    this.#workouts.forEach((workout) => {
      this.#renderWorkoutMarker(workout);
    });
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  #hideForm() {
    // Empty imputs
    inputDistance.value =
      inputCadence.value =
      inputElevation.value =
      inputDuration.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(event) {
    event.preventDefault();
    const validInputs = function (...inputs) {
      return inputs.every(function (input) {
        return Number.isFinite(input);
      });
    };
    const positiveInputs = function (...inputs) {
      return inputs.every(function (input) {
        return input > 0;
      });
    };
    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    // Check if data is valid
    // If it's running workout, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valud
      if (
        !validInputs(distance, duration, cadence) ||
        !positiveInputs(distance, duration, cadence)
      ) {
        return alert('Input has to be positive numbers - running');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // If it's cycling...
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveInputs(distance, duration)
      ) {
        return alert('Input has to be positive numbers - cycling');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    this.#workouts.push(workout);
    // Add the new object to the workout array
    // Render workout on map
    this.#renderWorkoutMarker(workout);
    // Render workout on list
    this.#renderWorkout(workout);
    // Hide the for + clear imput fields
    // Set local storage
    this.#setLocalStorage();
  }
  #renderWorkoutMarker(workout) {
    const popupOptions = {
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    };
    L.marker(workout.coordinates)
      .addTo(this.#map)
      .bindPopup(L.popup(popupOptions))
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
    // Clear input fields
    this.#hideForm();
  }
  #renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type} " data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>              
    `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
    `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
      `;
    }
    html += `
    </li>
    `;
    form.insertAdjacentHTML('afterend', html);
  }
  #moveToPopup(event) {
    const workoutEl = event.target.closest('.workout');
    if (!workoutEl) return;
    const clickedWorkout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );
    console.log(clickedWorkout);
    this.#map.setView(clickedWorkout.coordinates, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // Using the public interface
    // clickedWorkout.click();
  }
  #setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((workout) => {
      this.#renderWorkout(workout);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
