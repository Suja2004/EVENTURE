!function() {
  var today = moment();

  function Calendar(selector, events) {
    this.el = document.querySelector(selector);
    this.events = events;
    this.current = moment().date(1);
    this.draw();
    var current = document.querySelector('.today');
    if(current) {
      var self = this;
      window.setTimeout(function() {
        self.openDay(current);
      }, 500);
    }
  }

  Calendar.prototype.draw = function() {
    this.drawHeader();
    this.drawMonth();
    this.drawLegend();
  }

  Calendar.prototype.drawHeader = function() {
    var self = this;
    if(!this.header) {
      this.header = createElement('div', 'header');
      this.header.className = 'header';

      this.title = createElement('h1');

      var right = createElement('div', 'right');
      right.addEventListener('click', function() { self.nextMonth(); });

      var left = createElement('div', 'left');
      left.addEventListener('click', function() { self.prevMonth(); });

      this.header.appendChild(this.title); 
      this.header.appendChild(right);
      this.header.appendChild(left);
      this.el.appendChild(this.header);
    }

    this.title.innerHTML = this.current.format('MMMM YYYY');
  }

  Calendar.prototype.drawMonth = function() {
    var self = this;
    
    this.events.forEach(function(ev) {
      ev.date = moment(ev.date); // Parse the date from JSON
    });
    
    if(this.month) {
      this.oldMonth = this.month;
      this.oldMonth.className = 'month out ' + (self.next ? 'next' : 'prev');
      this.oldMonth.addEventListener('webkitAnimationEnd', function() {
        self.oldMonth.parentNode.removeChild(self.oldMonth);
        self.month = createElement('div', 'month');
        self.backFill();
        self.currentMonth();
        self.fowardFill();
        self.el.appendChild(self.month);
        window.setTimeout(function() {
          self.month.className = 'month in ' + (self.next ? 'next' : 'prev');
        }, 16);
      });
    } else {
      this.month = createElement('div', 'month');
      this.el.appendChild(this.month);
      this.backFill();
      this.currentMonth();
      this.fowardFill();
      this.month.className = 'month new';
    }
  }

  Calendar.prototype.backFill = function() {
    var clone = this.current.clone();
    var dayOfWeek = clone.day();

    if(!dayOfWeek) { return; }

    clone.subtract('days', dayOfWeek+1);

    for(var i = dayOfWeek; i > 0 ; i--) {
      this.drawDay(clone.add('days', 1));
    }
  }

  Calendar.prototype.fowardFill = function() {
    var clone = this.current.clone().add('months', 1).subtract('days', 1);
    var dayOfWeek = clone.day();

    if(dayOfWeek === 6) { return; }

    for(var i = dayOfWeek; i < 6 ; i++) {
      this.drawDay(clone.add('days', 1));
    }
  }

  Calendar.prototype.currentMonth = function() {
    var clone = this.current.clone();

    while(clone.month() === this.current.month()) {
      this.drawDay(clone);
      clone.add('days', 1);
    }
  }

  Calendar.prototype.getWeek = function(day) {
    if(!this.week || day.day() === 0) {
      this.week = createElement('div', 'week');
      this.month.appendChild(this.week);
    }
  }

  Calendar.prototype.drawDay = function(day) {
    var self = this;
    this.getWeek(day);

    var outer = createElement('div', this.getDayClass(day));
    outer.addEventListener('click', function() {
      self.openDay(this);
    });

    var name = createElement('div', 'day-name', day.format('ddd'));
    var number = createElement('div', 'day-number', day.format('DD'));

    var events = createElement('div', 'day-events');
    this.drawEvents(day, events);

    outer.appendChild(name);
    outer.appendChild(number);
    outer.appendChild(events);
    this.week.appendChild(outer);
  }

  Calendar.prototype.drawEvents = function(day, element) {
    if(day.month() === this.current.month()) {
      var todaysEvents = this.events.reduce(function(memo, ev) {
        if(ev.date.isSame(day, 'day')) {
          memo.push(ev);
        }
        return memo;
      }, []);

      todaysEvents.forEach(function(ev) {
        var evSpan = createElement('span', ev.color);
        element.appendChild(evSpan);
      });
    }
  }

  Calendar.prototype.getDayClass = function(day) {
    var classes = ['day'];
    if(day.month() !== this.current.month()) {
      classes.push('other');
    } else if (today.isSame(day, 'day')) {
      classes.push('today');
    }
    return classes.join(' ');
  }

  Calendar.prototype.openDay = function(el) {
    var details, arrow;
    var dayNumber = +el.querySelectorAll('.day-number')[0].innerText || +el.querySelectorAll('.day-number')[0].textContent;
    var day = this.current.clone().date(dayNumber);

    var currentOpened = document.querySelector('.details');

    if(currentOpened && currentOpened.parentNode === el.parentNode) {
      details = currentOpened;
      arrow = document.querySelector('.arrow');
    } else {
      if(currentOpened) {
        currentOpened.addEventListener('webkitAnimationEnd', function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener('oanimationend', function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener('msAnimationEnd', function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.addEventListener('animationend', function() {
          currentOpened.parentNode.removeChild(currentOpened);
        });
        currentOpened.className = 'details out';
      }

      details = createElement('div', 'details in');
      arrow = createElement('div', 'arrow');

      details.appendChild(arrow);
      el.parentNode.appendChild(details);
    }

    var todaysEvents = this.events.reduce(function(memo, ev) {
      if(ev.date.isSame(day, 'day')) {
        memo.push(ev);
      }
      return memo;
    }, []);

    this.renderEvents(todaysEvents, details);

    arrow.style.left = el.offsetLeft - el.parentNode.offsetLeft + 27 + 'px';
  }

  Calendar.prototype.renderEvents = function(events, ele) {
    var currentWrapper = ele.querySelector('.events');
    var wrapper = createElement('div', 'events in' + (currentWrapper ? ' new' : ''));

    var selectedDate = ele.getAttribute('data-date'); 
console.log(selectedDate);
    events.forEach(function(ev) {
        var div = createElement('div', 'event');
        var square = createElement('div', 'event-category ' + ev.color);
        var span = createElement('span', '', ev.eventName);
        var btn = createElement('button', 'edit', 'Edit Plan');

        btn.addEventListener('click', () => {
            document.getElementById('planner-container').style.display = 'flex';
            var eventDate = ev.date ? moment(ev.date).format('YYYY-MM-DD') : selectedDate;
            document.getElementById('visit-date').value = eventDate; 
        });

        div.appendChild(square);
        div.appendChild(span);
        div.appendChild(btn);
        wrapper.appendChild(div);
    });

    if (!events.length) {
        var div = createElement('div', 'event empty');
        var span = createElement('span', '', 'No Events');
        var btn = createElement('button', 'edit', 'Edit Plan');

        btn.addEventListener('click', () => {
            document.getElementById('planner-container').style.display = 'flex';
            document.getElementById('visit-date').value = selectedDate; 
        });

        div.appendChild(span);
        div.appendChild(btn);
        wrapper.appendChild(div);
    }

    if (currentWrapper) {
        currentWrapper.className = 'events out';
        currentWrapper.addEventListener('webkitAnimationEnd', function() {
            currentWrapper.parentNode.removeChild(currentWrapper);
            ele.appendChild(wrapper);
        });
        currentWrapper.addEventListener('oanimationend', function() {
            currentWrapper.parentNode.removeChild(currentWrapper);
            ele.appendChild(wrapper);
        });
        currentWrapper.addEventListener('msAnimationEnd', function() {
            currentWrapper.parentNode.removeChild(currentWrapper);
            ele.appendChild(wrapper);
        });
        currentWrapper.addEventListener('animationend', function() {
            currentWrapper.parentNode.removeChild(currentWrapper);
            ele.appendChild(wrapper);
        });
    } else {
        ele.appendChild(wrapper);
    }
};

  Calendar.prototype.drawLegend = function() {
    var legend = createElement('div', 'legend');
    var calendars = this.events.map(function(e) {
      return e.calendar + '|' + e.color;
    }).reduce(function(memo, e) {
      if(memo.indexOf(e) === -1) {
        memo.push(e);
      }
      return memo;
    }, []).forEach(function(e) {
      var parts = e.split('|');
      var entry = createElement('span', 'entry ' +  parts[1], parts[0]);
      legend.appendChild(entry);
    });
    this.el.appendChild(legend);
  }

  Calendar.prototype.nextMonth = function() {
    this.current.add('months', 1);
    this.next = true;
    this.draw();
  }

  Calendar.prototype.prevMonth = function() {
    this.current.subtract('months', 1);
    this.next = false;
    this.draw();
  }

  window.Calendar = Calendar;

  function createElement(tagName, className, innerText) {
    var ele = document.createElement(tagName);
    if(className) {
      ele.className = className;
      ele.id = className;
    }
    if(innerText) {
      ele.innderText = ele.textContent = innerText;
    }
    return ele;
  }
}();

const plans = JSON.parse(localStorage.getItem("plans")) || [];

document.addEventListener('DOMContentLoaded', function() {
  fetch('json/events.json')
    .then(response => response.json())
    .then(data => {
      // Extract events from the JSON
      const events = data.features.map(event => {
        return {
          eventName: event.properties.name,
          calendar: event.properties.category,
          color: 'orange',
          date: event.properties.date
        };
      });

      // Fetch plans from localStorage and send them to the calendar as events
      const localStorageEvents = plans.map(plan => {
        return {
          eventName: plan.title,  // Use the title from the plan
          calendar: 'Personal Plan',  // Category for personal plans
          color: 'blue',  // Use a different color for localStorage events
          date: plan.visitDate  // Use the visitDate from the plan
        };
      });

      // Combine JSON events and localStorage plans
      const combinedEvents = events.concat(localStorageEvents);

      // Initialize the calendar with both sets of events
      new Calendar('#calendar', combinedEvents);
    })
    .catch(error => console.error('Error loading events:', error));

  // Plans management section
  const plansList = document.getElementById("plans-list");

  if (plans.length === 0) {
    plansList.innerHTML = "<p>No plans saved yet.</p>";
  } else {
    plans.forEach((plan, index) => {
      const planElement = document.createElement("div");
      planElement.classList.add("plan-card"); // Add a class for card styling
      planElement.innerHTML = `
        <h2>${plan.title}</h2>
        <p><strong>Location:</strong> ${plan.location}</p>
        <p><strong>Date of Visit:</strong> ${plan.visitDate}</p>
        <h3>Attractions:</h3>
        <div class="attractions">
            ${plan.attractions.map(attraction => `
                <div class="attraction">
                    <p><strong>${attraction.time} ${attraction.name}</strong></p>
                </div>
            `).join('')}
        </div>
        <button class="delete-btn" data-index="${index}">Delete Plan</button>
      `;

      // Add delete functionality
      planElement.querySelector('.delete-btn').addEventListener('click', (event) => {
        const indexToDelete = event.target.getAttribute('data-index');
        deletePlan(indexToDelete);
      });

      plansList.appendChild(planElement);
    });
  }

  function deletePlan(index) {
    let plans = JSON.parse(localStorage.getItem("plans")) || [];
    plans.splice(index, 1); // Remove the plan at the specified index
    localStorage.setItem("plans", JSON.stringify(plans)); // Save the updated plans list to local storage
    location.reload(); // Reload the page to reflect changes
  }

  // Event listener for returning to plans page
  document.getElementById('return').addEventListener('click', function () {
    window.location.href = 'plans.html';
  });
});



  document.addEventListener('DOMContentLoaded', () => {
    const addAttractionButton = document.getElementById('add-attraction');
    const attractionsContainer = document.getElementById('attractions-container');
    let attractionCount = 1;

    attractionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-attraction')) {
            event.target.closest('.attraction-group').remove();
        }
    });

    addAttractionButton.addEventListener('click', () => {
        attractionCount++;

        const attractionGroup = document.createElement('div');
        attractionGroup.className = 'attraction-group';
        attractionGroup.id = `attraction-${attractionCount}`;

        attractionGroup.innerHTML = `
            <label for="time-${attractionCount}">Time of Visit:</label>
            <input type="time" id="time-${attractionCount}" class="time" name="time[]" required>

            <label for="attraction-name-${attractionCount}">Attraction Name:</label>
            <input type="text" class="attraction-name" id="attraction-name-${attractionCount}" name="attraction-name[]" required>

            <button type="button" class="remove-attraction">Remove</button>
        `;

        attractionsContainer.appendChild(attractionGroup);
    });

    document.getElementById('cancel').addEventListener('click',()=>{
      document.getElementById('planner-container').style.display = 'none';
    });

    document.getElementById("visit-form").addEventListener("submit", function (event) {
      event.preventDefault();
  
      // Capture form data
      const title = document.getElementById("title").value;
      const location = document.getElementById("location").value;
      const visitDate = document.getElementById("visit-date").value;
      const time = document.querySelectorAll(".time");
      const attractionNames = document.querySelectorAll(".attraction-name");
  
      const attractions = [];
      time.forEach((timeInput, index) => {
          attractions.push({ 
              time: timeInput.value,
              name: attractionNames[index].value
          });
      });
  
      // Create the plan object
      const plan = {
          title,
          location,
          visitDate,
          attractions
      };
  
      // Save the plan to local storage
      let plans = JSON.parse(localStorage.getItem("plans")) || [];
      plans.push(plan);
      localStorage.setItem("plans", JSON.stringify(plans));
  
      
  });
  

  document.getElementById('view').addEventListener('click', function() {
    window.location.href = 'plan-list.html';
});

});
