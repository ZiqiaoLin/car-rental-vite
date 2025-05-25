import { createClient } from '@supabase/supabase-js';
import './input.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    const unavailableDiv = document.getElementById('unavailableBooking');
    const unavailablePer = document.getElementById('unavailablePeriod');
    const emptyDiv = document.getElementById('emptyBooking');
    const cartDiv = document.getElementById('carsCart');
    const listDiv = document.getElementById('carList');
    const totalDiv = document.getElementById('totalPrice');
    const form = document.getElementById('bookingForm');
    const clearBtn = document.getElementById('clearBooking');
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    const submitBtn = form.querySelector('button[type="submit"]');
    const inputs = Array.from(form.querySelectorAll('input'));

    const selected = JSON.parse(localStorage.getItem('selectedCar'));
    const savedForm = JSON.parse(localStorage.getItem('bookingForm')) || {};
    if (selected) {
      emptyDiv.classList.add('hidden');
      cartDiv.classList.add('hidden');
      form.classList.add('hidden');
      unavailablePer.classList.add('hidden');

      const start = savedForm.startDate;
      const end = savedForm.endDate;
      const rangeStart = start || new Date().toISOString().slice(0, 10);
      const rangeEnd = end || rangeStart;

      const { data: conflict, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('car_id', selected.vin)
        .overlaps('period', `[${rangeStart},${rangeEnd}]`);

      if (error) {
        console.error('Check vehicle availability failed', error);
      }

      if (conflict && conflict.length > 0) {
        unavailableDiv.classList.remove('hidden');
        return;
      }
    }

    emptyDiv.classList.add('hidden');
    unavailableDiv.classList.add('hidden');
    unavailablePer.classList.add('hidden');
    cartDiv.classList.remove('hidden');
    form.classList.remove('hidden');

    if (selected) {
      emptyDiv.classList.add('hidden');
      cartDiv.classList.remove('hidden');
      listDiv.innerHTML = `
        <div class="flex justify-between items-center w-full h-36">
          <div class="flex items-center">
            <img src="${selected.imageUrl}" class="h-24" alt="${selected.brand} ${selected.model}">
            <div class="flex flex-col justify-center ml-2.5">
              <h2 class="font-bold">${selected.brand} ${selected.model}</h2>
              <p>${selected.type} | ${selected.fuelType}</p>
            </div>
          </div>
          <div class="flex items-center justify-center w-16 h-6 bg-[#98252d] text-stone-50 text-sm font-bold select-none">
            $${selected.pricePerDay} / day
          </div>
        </div>
      `;
    } else {
      emptyDiv.classList.remove('hidden');
      cartDiv.classList.add('hidden');
      listDiv.innerHTML = '';
    }

    Object.keys(savedForm).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = savedForm[id];
    });

    form.querySelectorAll('input:not([type="date"])').forEach(el => {
      const label = form.querySelector(`label[for="${el.id}"]`);
      if (!label) return;
      if (el.value.trim() !== '') {
        label.classList.add('top-1', 'text-xs');
        label.classList.remove('top-3.5', 'text-sm');
      }
    });

    form.querySelectorAll('input:not([type="date"])').forEach(el => {
      const label = form.querySelector(`label[for="${el.id}"]`);

      el.addEventListener('focus', () => {
        if (label) {
          label.classList.add('top-1', 'text-xs');
          label.classList.remove('top-3.5', 'text-sm');
        }
      });

      el.addEventListener('blur', () => {
        if (label && el.value.trim() === '') {
          label.classList.remove('top-1', 'text-xs');
          label.classList.add('top-3.5', 'text-sm');
        }
      });
    });
    form.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', () => {
        const data = JSON.parse(localStorage.getItem('bookingForm')) || {};
        data[el.id] = el.value;
        localStorage.setItem('bookingForm', JSON.stringify(data));
        if (el.id === 'startDate' || el.id === 'endDate') updateTotal();
        updateSubmitBtn();
      });
    });

    function checkVaild(info, re) {
      const input = document.querySelector(`#${info}`)
      input.addEventListener('blur', () => {
        if (!re.test(input.value) && input.value.trim() !== '') {
          document.querySelector(`.${info} .validP`).classList.remove('hidden')
          input.classList.add('border-red-600')
          input.classList.remove('border-gray-500')
        } else {
          document.querySelector(`.${info} .validP`).classList.add('hidden')
          input.classList.add('border-gray-500')
          input.classList.remove('border-red-600')
        }
      })
    }
    checkVaild('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    checkVaild('phone', /^(\+61|0)4\d{8}$/)
    checkVaild('name', /^[a-zA-Z\s'-]{2,50}$/)
    checkVaild('driversLicense', /^\d{8}$/);
    (function initDateValidation() {
      const startInput = document.querySelector('#startDate')
      const endInput = document.querySelector('#endDate')
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      function clearDateError(inputEl) {
        const div = inputEl.closest('div')
        const emptyP = div.querySelector('.empty')
        const validP = div.querySelector('.validP')
        emptyP.classList.add('hidden')
        validP.classList.add('hidden')
        inputEl.classList.remove('border-red-600')
        inputEl.classList.add('border-gray-500')
      }

      function validateStartDateReal() {
        clearDateError(startInput)
        const v = startInput.value
        if (!v) return
        if (new Date(v) < today) {
          const validP = startInput.closest('div').querySelector('.validP')
          validP.classList.remove('hidden')
          startInput.classList.add('border-red-600')
        }
      }

      function validateEndDateReal() {
        clearDateError(endInput)
        const sv = startInput.value
        const ev = endInput.value
        if (!ev) return
        if (sv && new Date(ev) <= new Date(sv)) {
          const validP = endInput.closest('div').querySelector('.validP')
          validP.classList.remove('hidden')
          endInput.classList.add('border-red-600')
        }
      }

      startInput.addEventListener('input', validateStartDateReal)
      startInput.addEventListener('blur', validateStartDateReal)
      startInput.addEventListener('input', validateEndDateReal)

      endInput.addEventListener('input', validateEndDateReal)
      endInput.addEventListener('blur', validateEndDateReal)
    })();

    function updateTotal() {
      if (selected && startInput.value && endInput.value) {
        const s = new Date(startInput.value);
        const e = new Date(endInput.value);
        if (e > s) {
          const days = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
          totalDiv.textContent = `TOTAL: $${(days * selected.pricePerDay).toFixed(2)} AUD`;
          return;
        }
      }
      totalDiv.textContent = 'TOTAL: $0.00 AUD';
    }
    startInput.addEventListener('input', updateTotal);
    endInput.addEventListener('input', updateTotal);
    updateTotal();

    // —— 4. CLEAR Booking —— 
    clearBtn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('selectedCar');
      localStorage.removeItem('bookingForm');
      emptyDiv.classList.remove('hidden');
      cartDiv.classList.add('hidden');
      listDiv.innerHTML = '';
      form.reset();
      totalDiv.textContent = 'TOTAL: $0.00 AUD';
      form.querySelectorAll('label').forEach(lbl => {
        lbl.classList.remove('top-1', 'text-xs');
        lbl.classList.add('top-3.5', 'text-sm');
      });
      updateSubmitBtn();
    });

    submitBtn.disabled = true;
    submitBtn.classList.remove('cursor-pointer')
    submitBtn.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');

    const rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^(\+61|0)4\d{8}$/,
      name: /^[a-zA-Z\s'-]{2,50}$/,
      driversLicense: /^\d{8}$/
    };
    const today = new Date(); today.setHours(0, 0, 0, 0);

    function isFormValid() {
      return inputs.every(input => {
        const v = input.value.trim();
        if (!v) return false;
        if (input.id === 'startDate' && new Date(v) < today) return false;
        if (input.id === 'endDate' && new Date(v) <= new Date(startInput.value)) return false;
        if (rules[input.id] && !rules[input.id].test(v)) return false;
        return true;
      });
    }

    function updateSubmitBtn() {
      if (isFormValid()) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
        submitBtn.classList.add('border-red-900', 'text-red-900', 'hover:bg-red-900', 'hover:text-stone-50', 'cursor-pointer');
      } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
        submitBtn.classList.remove('border-red-900', 'text-red-900', 'hover:bg-red-900', 'hover:text-stone-50', 'cursor-pointer');
      }
    }

    inputs.forEach(i => i.addEventListener('input', updateSubmitBtn));
    updateSubmitBtn();


    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!inputs.every(i => i.value.trim())) return;

      submitBtn.disabled = true;
      try {
        const { data: conflict, error: conflictError } = await supabase
          .from('bookings')
          .select('id')
          .eq('car_id', selected.vin)
          .overlaps('period', `[${startInput.value},${endInput.value}]`);

        if (conflictError) {
          console.error('An error occurred while checking availability', conflictError);
          alert('Verification failed, please try again later');
          submitBtn.disabled = false;
          return;
        }
        if (conflict.length > 0) {
          document.getElementById('unavailablePeriod').classList.remove('hidden');
          cartDiv.classList.add('hidden');
          form.classList.add('hidden');
          return;
        }
      } catch (err) {
        console.error('An error occurred while checking availability', err);
        alert('Verification failed, please try again later');
        submitBtn.disabled = false;
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          car_id: selected.vin,
          start_date: form.startDate.value,
          end_date: form.endDate.value
        }], { returning: 'representation' }).select('id');

      if (error) {
        alert('Failed to lock the car, please try again later');
        submitBtn.disabled = false;
        return;
      }

      const bookingId = data[0].id;
      localStorage.setItem('bookingId', bookingId);

      const formData = inputs.reduce((o, i) => ({ ...o, [i.id]: i.value.trim() }), {});
      localStorage.setItem('bookingForm', JSON.stringify(formData));

      window.location.href = 'confirmation.html';

    });

  });
})();
