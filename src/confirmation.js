import { createClient } from '@supabase/supabase-js';
import './input.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const confirmInfo = document.getElementById('confirmInfo');
  const successDiv = document.getElementById('successBooking');
  const orderList = document.getElementById('orderList');
  const infoUl = confirmInfo.querySelector('ul');
  const totalDiv = document.getElementById('totalPrice');
  const cancelBtn = document.getElementById('clearBooking');
  const confirmBtn = document.getElementById('confirmBtn');

  const selected = JSON.parse(localStorage.getItem('selectedCar'));
  const formData = JSON.parse(localStorage.getItem('bookingForm'));
  const bookingId = localStorage.getItem('bookingId');


  const days = Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));
  const total = days * selected.pricePerDay;
  orderList.innerHTML = `
    <div class="flex justify-between items-center w-full h-36">
      <div class="flex items-center">
        <img src="${selected.imageUrl}" class="h-24">
        <div class="flex flex-col justify-center ml-2.5">
          <h2 class="font-bold">${selected.brand} ${selected.model}</h2>
          <p>${selected.type} | ${selected.fuelType}</p>
        </div>
      </div>
      <div class="flex items-center justify-center w-16 h-6 bg-[#98252d] text-stone-50 text-sm font-bold">
        $${selected.pricePerDay} / day
      </div>
    </div>`;
  totalDiv.textContent = `TOTAL: $${total.toFixed(2)} AUD`;


  ['email', 'phone', 'name', 'driversLicense', 'startDate', 'endDate'].forEach(key => {
    const words = key.replace(/([A-Z])/g, ' $1').toLowerCase();

    const label = words.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    const li = document.createElement('li');
    li.textContent = `${label}: ${formData[key]}`;
    infoUl.appendChild(li);
  });

  let hasCanceled = false;
  let bookingConfirmed = false;

  async function cancelBooking() {
    if (hasCanceled || bookingConfirmed) return;
    hasCanceled = true;
    try {
      await supabase.from('bookings').delete().eq('id', bookingId);
    } catch (e) {
      console.error('Cancel booking failed', e);
    }
    localStorage.clear();
    window.location.href = 'index.html';
  }

  cancelBtn.addEventListener('click', async () => {
    await cancelBooking();
  });
  document.querySelectorAll('a[href="/"]').forEach(logoLink => {
    logoLink.addEventListener('click', async (e) => {
      e.preventDefault();
      await cancelBooking();
      window.location.href = '/';
    });
  });

  const autoCancelTimer = setTimeout(cancelBooking, 5 * 60 * 1000);

  confirmBtn.addEventListener('click', () => {
    clearTimeout(autoCancelTimer);
    bookingConfirmed = true;
    localStorage.clear();
    confirmInfo.classList.add('hidden');
    successDiv.classList.remove('hidden');
  });

  window.addEventListener('beforeunload', () => {
    if (!bookingConfirmed) {
      cancelBooking();
    }
  });
});
