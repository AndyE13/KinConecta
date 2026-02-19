// tours.js - Gestión de tours y formulario

let toursData = [];

// Cargar tours desde el archivo JSON
async function loadTours() {
    try {
        const response = await fetch('tours.json');
        toursData = await response.json();
        renderTours();
    } catch (error) {
        console.error('Error al cargar tours:', error);
        showAlert('Error al cargar los tours', 'danger');
    }
}

// Renderizar tours en el DOM
function renderTours() {
    const toursGrid = document.querySelector('.tours-grid');
    toursGrid.innerHTML = '';
    
    toursData.forEach(tour => {
        const tourCard = createTourCard(tour);
        toursGrid.appendChild(tourCard);
    });
}

// Crear elemento de tarjeta de tour
function createTourCard(tour) {
    const card = document.createElement('div');
    card.className = `tour-card ${tour.status === 'draft' ? 'draft' : ''}`;
    
    const statusText = {
        'active': 'Activo',
        'draft': 'Borrador',
        'pending': 'Pendiente'
    };
    
    const ratingDisplay = tour.rating ? tour.rating.toFixed(1) : (tour.status === 'pending' ? 'New' : '--');
    const priceDisplay = tour.price > 0 ? `$${tour.price} ${tour.currency}` : '--';
    
    card.innerHTML = `
        <div class="tour-image ${tour.imageClass}">
            <div class="image-overlay"></div>
            <div class="tour-status ${tour.status}">
                <span class="status-indicator"></span> ${statusText[tour.status]}
            </div>
        </div>
        <div class="tour-content">
            <div class="tour-header">
                <h3 class="tour-title">${tour.title}</h3>
                <div class="tour-rating ${!tour.rating ? 'empty' : ''}">
                    <span class="material-symbols-outlined">star</span> ${ratingDisplay}
                </div>
            </div>
            <p class="tour-description">${tour.description}</p>
            <div class="tour-stats ${tour.status === 'draft' ? 'dashed' : ''}">
                <div class="stat-item">
                    <span class="stat-label">Reservas</span>
                    <div class="stat-value ${tour.bookings === 0 ? 'empty' : ''}">
                        <span class="material-symbols-outlined">group</span>
                        <span>${tour.bookings}</span>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Precio</span>
                    <div class="stat-value ${tour.price === 0 ? 'empty' : ''}">
                        <span class="material-symbols-outlined">payments</span>
                        <span>${priceDisplay}</span>
                    </div>
                </div>
            </div>
            <div class="tour-actions">
                ${getTourActionButtons(tour)}
            </div>
        </div>
    `;
    
    return card;
}

// Obtener botones de acción según el estado del tour
function getTourActionButtons(tour) {
    if (tour.status === 'draft') {
        return `
            <button class="btn-continue" onclick="editTour(${tour.id})">
                <span class="material-symbols-outlined">edit_note</span> Continuar Editando
            </button>
        `;
    } else if (tour.status === 'pending') {
        return `
            <button class="btn-edit" onclick="editTour(${tour.id})">
                <span class="material-symbols-outlined">edit</span> Editar
            </button>
            <button class="btn-disabled" disabled>
                <span class="material-symbols-outlined">hourglass_empty</span> En Revisión
            </button>
        `;
    } else {
        return `
            <button class="btn-edit" onclick="editTour(${tour.id})">
                <span class="material-symbols-outlined">edit</span> Editar
            </button>
            <button class="btn-view" onclick="viewBookings(${tour.id})">
                <span class="material-symbols-outlined">calendar_month</span> Ver Reservas
            </button>
        `;
    }
}

// Abrir modal de crear/editar tour
function openTourModal(tourId = null) {
    const modal = document.getElementById('tourModal');
    const form = document.getElementById('tourForm');
    const modalTitle = document.getElementById('modalTitle');
    
    if (tourId) {
        const tour = toursData.find(t => t.id === tourId);
        if (tour) {
            modalTitle.textContent = 'Editar Tour';
            populateForm(tour);
        }
    } else {
        modalTitle.textContent = 'Crear Nuevo Tour';
        form.reset();
        clearErrors();
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Cerrar modal
function closeTourModal() {
    const modal = document.getElementById('tourModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    document.getElementById('tourForm').reset();
    clearErrors();
}

// Poblar formulario con datos de tour existente
function populateForm(tour) {
    document.getElementById('tourTitle').value = tour.title;
    document.getElementById('tourDescription').value = tour.description;
    document.getElementById('tourPrice').value = tour.price;
    document.getElementById('tourCategory').value = tour.category;
    document.getElementById('tourDuration').value = tour.duration;
    document.getElementById('tourMaxGroup').value = tour.maxGroupSize;
    document.getElementById('tourMeetingPoint').value = tour.meetingPoint;
    document.getElementById('tourIncluded').value = tour.includedItems.join(', ');
    document.getElementById('tourStatus').value = tour.status;
}

// Validar formulario
function validateForm() {
    clearErrors();
    let isValid = true;
    const errors = [];
    
    // Validar título
    const title = document.getElementById('tourTitle').value.trim();
    if (title.length < 5) {
        showFieldError('tourTitle', 'El título debe tener al menos 5 caracteres');
        errors.push('Título inválido');
        isValid = false;
    }
    
    // Validar descripción
    const description = document.getElementById('tourDescription').value.trim();
    if (description.length < 20) {
        showFieldError('tourDescription', 'La descripción debe tener al menos 20 caracteres');
        errors.push('Descripción muy corta');
        isValid = false;
    }
    
    // Validar precio
    const price = parseFloat(document.getElementById('tourPrice').value);
    if (isNaN(price) || price < 0) {
        showFieldError('tourPrice', 'Ingrese un precio válido (mínimo 0)');
        errors.push('Precio inválido');
        isValid = false;
    }
    
    // Validar categoría
    const category = document.getElementById('tourCategory').value.trim();
    if (category === '') {
        showFieldError('tourCategory', 'Seleccione o escriba una categoría');
        errors.push('Categoría requerida');
        isValid = false;
    }
    
    // Validar duración
    const duration = parseInt(document.getElementById('tourDuration').value);
    if (isNaN(duration) || duration < 1 || duration > 12) {
        showFieldError('tourDuration', 'La duración debe estar entre 1 y 12 horas');
        errors.push('Duración inválida');
        isValid = false;
    }
    
    // Validar tamaño del grupo
    const maxGroup = parseInt(document.getElementById('tourMaxGroup').value);
    if (isNaN(maxGroup) || maxGroup < 1 || maxGroup > 50) {
        showFieldError('tourMaxGroup', 'El tamaño del grupo debe estar entre 1 y 50 personas');
        errors.push('Tamaño de grupo inválido');
        isValid = false;
    }
    
    // Validar punto de encuentro
    const meetingPoint = document.getElementById('tourMeetingPoint').value.trim();
    if (meetingPoint.length < 5) {
        showFieldError('tourMeetingPoint', 'El punto de encuentro debe tener al menos 5 caracteres');
        errors.push('Punto de encuentro inválido');
        isValid = false;
    }
    
    // Validar items incluidos
    const included = document.getElementById('tourIncluded').value.trim();
    if (included.length < 5) {
        showFieldError('tourIncluded', 'Especifique al menos un item incluido');
        errors.push('Items incluidos requeridos');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Por favor corrija los errores en el formulario', 'danger');
    }
    
    return isValid;
}

// Mostrar error en campo específico
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.classList.add('error');
    formGroup.appendChild(errorDiv);
}

// Limpiar errores del formulario
function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

// Mostrar alerta estilo Bootstrap
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="closeAlert('${alertId}')">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        closeAlert(alertId);
    }, 5000);
}

// Cerrar alerta
function closeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }
}

// Guardar tour (crear o actualizar)
async function saveTour(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Crear objeto JSON con los datos del formulario
    const tourData = {
        id: toursData.length + 1,
        title: document.getElementById('tourTitle').value.trim(),
        description: document.getElementById('tourDescription').value.trim(),
        price: parseFloat(document.getElementById('tourPrice').value),
        currency: 'MXN',
        bookings: 0,
        rating: null,
        status: document.getElementById('tourStatus').value,
        imageClass: getRandomImageClass(),
        category: document.getElementById('tourCategory').value.trim(),
        duration: parseInt(document.getElementById('tourDuration').value),
        maxGroupSize: parseInt(document.getElementById('tourMaxGroup').value),
        includedItems: document.getElementById('tourIncluded').value.split(',').map(item => item.trim()),
        meetingPoint: document.getElementById('tourMeetingPoint').value.trim()
    };
    
    // Mostrar el objeto JSON en consola
    console.log('Nuevo tour creado:', JSON.stringify(tourData, null, 2));
    
    // Agregar el tour al array
    toursData.push(tourData);
    
    // Guardar en localStorage (simulación de persistencia)
    localStorage.setItem('toursData', JSON.stringify(toursData));
    
    // Re-renderizar tours
    renderTours();
    
    // Cerrar modal y mostrar mensaje de éxito
    closeTourModal();
    showAlert('Tour creado exitosamente', 'success');
}

// Obtener clase de imagen aleatoria
function getRandomImageClass() {
    const imageClasses = ['active-tour', 'teotihuacan', 'architecture', 'coyoacan', 'xochimilco', 
                         'street-art', 'lucha-libre', 'cantinas', 'markets', 'chapultepec'];
    return imageClasses[Math.floor(Math.random() * imageClasses.length)];
}

// Funciones auxiliares (placeholder)
function editTour(tourId) {
    openTourModal(tourId);
}

function viewBookings(tourId) {
    showAlert('Funcionalidad de ver reservas en desarrollo', 'info');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar tours
    loadTours();
    
    // Botón crear tour
    const createButton = document.querySelector('.create-tour-button');
    if (createButton) {
        createButton.addEventListener('click', () => openTourModal());
    }
    
    // Botón cerrar modal
    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeTourModal);
    }
    
    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('tourModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTourModal();
            }
        });
    }
    
    // Formulario de tour
    const tourForm = document.getElementById('tourForm');
    if (tourForm) {
        tourForm.addEventListener('submit', saveTour);
    }
    
    // Cargar tours guardados de localStorage si existen
    const savedTours = localStorage.getItem('toursData');
    if (savedTours) {
        toursData = JSON.parse(savedTours);
        renderTours();
    }
});