import { createClient } from '@supabase/supabase-js';
import './input.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchUnavailableToday() {
  const now = new Date();
  const today = now.toLocaleDateString('en-CA');

  const { data, error } = await supabase
    .from('bookings')
    .select('car_id')
    .lte('start_date', today)
    .gte('end_date', today);
  if (error) {
    console.error('Failed to check today booked vehicles', error);
    return new Set();
  }
  return new Set(data.map(r => r.car_id));
}

document.addEventListener('DOMContentLoaded', () => {
  const makeBtn = document.querySelector('.make');
  const makeSpan = makeBtn.querySelector('.makeSpan');
  const makeDD = document.querySelector('.makeDropDown');
  const typeBtn = document.querySelector('.bodyType');
  const typeSpan = typeBtn.querySelector('.bodyTypeSpan');
  const typeDD = document.querySelector('.bodyTypeDropDown');
  const searchInput = document.querySelector('input[type="search"]');
  const searchBtn = document.querySelector('.searchBtn');
  const searchDropDown = document.querySelector('.searchDropDown');
  const searchDropUl = searchDropDown.querySelector('ul');
  const container = document.getElementById('carList');

  function toggle(dd, arrow) {
    dd.classList.toggle('hidden');
    arrow.classList.toggle('rotate-180');
  }
  function hide(dd, arrow) {
    dd.classList.add('hidden');
    arrow.classList.remove('rotate-180');
  }

  [makeDD, typeDD].forEach(dd => dd.addEventListener('click', e => e.stopPropagation()));

  document.addEventListener('click', () => {
    hide(makeDD, makeSpan);
    hide(typeDD, typeSpan);
    searchDropDown.classList.add('hidden');
  });

  makeBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggle(makeDD, makeSpan);
  });
  typeBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggle(typeDD, typeSpan);
  });

  makeSpan.addEventListener('click', e => {
    e.stopPropagation();
    if (makeSpan.textContent === '') {
      makeBtn.querySelector('span').textContent = 'All makes';
      makeSpan.textContent = '';
      hide(makeDD, makeSpan);
    } else {
      toggle(makeDD, makeSpan);
    }
  });
  typeSpan.addEventListener('click', e => {
    e.stopPropagation()
    if (typeSpan.textContent === '') {
      typeBtn.querySelector('span').textContent = 'All body types';
      typeSpan.textContent = '';
      hide(typeDD, typeSpan);
    } else {
      toggle(typeDD, typeSpan);
    }
  });

  makeDD.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', e => {
      const sel = e.target.textContent.trim();
      makeBtn.querySelector('span').textContent = sel;
      makeSpan.textContent = '';
      hide(makeDD, makeSpan);
    });
  });

  typeDD.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', e => {
      const sel = e.target.textContent.trim();
      typeBtn.querySelector('span').textContent = sel;
      typeSpan.textContent = '';
      hide(typeDD, typeSpan);
    });
  });

  let carsData = [];
  fetch('cars.json')
    .then(res => res.json())
    .then(async cars => {
      carsData = cars;
      const bookedSet = await fetchUnavailableToday();
      renderCars(carsData, bookedSet);
    })
    .catch(console.error);

  function renderCars(list, bookedSet = new Set()) {
    if (!container) return;
    container.innerHTML = '';
    list.forEach(car => {
      const disabled = bookedSet.has(car.vin);
      const btnClass = disabled
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'border-red-900 text-red-900 hover:bg-red-900 hover:text-white cursor-pointer';
      const btnText = disabled ? 'Unavailable' : 'Booking Now';
      const card = document.createElement('div');
      card.className = 'flex flex-col bg-white';
      card.innerHTML = `
          <div class="w-full pt-10 group overflow-hidden">
            <img src="/${car.imageUrl}" alt="${car.brand} ${car.model}"
              class="w-2/3 h-auto mx-auto transform transition-transform duration-[500ms] group-hover:scale-125 group-hover:duration-[1000ms]">
          </div>
          <h3 class="font-extrabold text-2xl text-center pt-4">${car.brand} ${car.model}</h3>
          <div class="mx-auto text-sm pb-3">
            <span>${car.type}|</span>
            <span>${car.fuelType}</span>
          </div>
          <div class="flex justify-around px-1.5 mb-5">
            <span
              class="flex items-center justify-center w-16 h-6 bg-red-900 text-stone-50 text-sm font-bold select-none">$${car.pricePerDay} /
              Day</span>
            <span class="stock flex items-center justify-center h-6 text-sm font-medium select-none">${disabled ? 'Unavailable' : 'available'}</span>
          </div>
          <button type="button"
          class="bookingCar border w-44 h-8 mb-8 mx-auto font-bold ${btnClass}"
          ${disabled ? 'disabled' : ''}>
          ${btnText}
        </button>
      `;
      if (!disabled) {
        card.querySelector('.bookingCar').addEventListener('click', () => {
          localStorage.setItem('selectedCar', JSON.stringify(car));
          window.location.href = 'booking.html';
        });
      }
      container.appendChild(card)
    });
  }

  searchDropDown.classList.add('hidden');

  function getSuggestions(query) {
    if (!query) return [];
    const low = query.toLowerCase();
    let filtered = carsData;
    const selMake = makeBtn.querySelector('span').textContent;
    if (selMake !== 'All makes') filtered = filtered.filter(c => c.brand === selMake);
    const selType = typeBtn.querySelector('span').textContent;
    if (selType !== 'All body types') filtered = filtered.filter(c => c.type === selType);
    const set = new Set();
    filtered.forEach(c => {
      if (c.brand.toLowerCase().includes(low)) set.add(c.brand);
      if (c.model.toLowerCase().includes(low)) set.add(c.model);
      if (c.type.toLowerCase().includes(low)) set.add(c.type);
    });
    return [...set];
  }

  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    const suggestions = getSuggestions(val);
    searchDropUl.innerHTML = suggestions.map(s => `<li class="flex items-center h-9 hover:underline cursor-pointer px-2">${s}</li>`).join('');
    if (suggestions.length && val) searchDropDown.classList.remove('hidden'); else searchDropDown.classList.add('hidden');

    searchDropUl.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        const key = li.textContent;
        searchInput.value = key;
        const selMake = makeBtn.querySelector('span').textContent;
        const selType = typeBtn.querySelector('span').textContent;
        let filtered = carsData;
        if (selMake !== 'All makes') filtered = filtered.filter(c => c.brand === selMake);
        if (selType !== 'All body types') filtered = filtered.filter(c => c.type === selType);
        filtered = filtered.filter(c => c.brand === key || c.model === key || c.type === key);
        renderCars(filtered);
        searchDropDown.classList.add('hidden');
      });
    });
  });

  function handleSearch() {
    const val = searchInput.value.trim().toLowerCase();
    const selMake = makeBtn.querySelector('span').textContent;
    const selType = typeBtn.querySelector('span').textContent;
    if (!val && selMake === 'All makes' && selType === 'All body types') {
      renderCars(carsData);
      searchDropDown.classList.add('hidden'); return;
    }
    let filtered = carsData;
    if (selMake !== 'All makes') filtered = filtered.filter(c => c.brand === selMake);
    if (selType !== 'All body types') filtered = filtered.filter(c => c.type === selType);
    if (val) {
      filtered = filtered.filter(c => c.brand.toLowerCase().includes(val) || c.model.toLowerCase().includes(val) || c.type.toLowerCase().includes(val));
    }
    renderCars(filtered);
    searchDropDown.classList.add('hidden');
  }
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
});
