// Selecciona el formulario y el input de imagen del HTML
const form = document.querySelector("form");
const imageInput = document.querySelector("input");

// Selecciona la imagen donde se mostrará la imagen seleccionada
const selectedImage = document.querySelector("#selected-image");

// Función asincrónica para cargar el modelo MobileNet
async function loadModel() {
  const model = await mobilenet.load(); // Carga el modelo MobileNet
  return model;
}

// Función para clasificar una imagen dada usando el modelo cargado
async function classifyImage(model, img) {
  const predictions = await model.classify(img); // Realiza la predicción
  return predictions; // Devuelve las predicciones
}

// Función para guardar las predicciones en el almacenamiento local
function saveToLocalStorage(predictions, imageUrl) {
  // Obtiene el historial de predicciones del almacenamiento local o crea uno vacío
  const history = JSON.parse(localStorage.getItem('predictionHistory')) || [];
  // Agrega las nuevas predicciones al historial
  history.push({ imageUrl, predictions });
  // Guarda el historial actualizado en el almacenamiento local
  localStorage.setItem('predictionHistory', JSON.stringify(history));
}

// Función para renderizar el historial de predicciones en el HTML
function renderHistory() {
  // Obtiene el historial de predicciones desde el almacenamiento local
  const history = JSON.parse(localStorage.getItem('predictionHistory')) || [];
  // Obtiene el contenedor donde se mostrará el historial
  const historyContainer = document.getElementById('history');
  historyContainer.innerHTML = ''; // Limpia el contenido actual del contenedor

  // Itera sobre cada elemento del historial
  history.forEach((item, index) => {
    // Crea un elemento div para mostrar cada predicción individual
    const div = document.createElement('div');
    div.classList.add('p-2', 'border', 'm-1', 'bg-white', 'rounded-3', 'shadow-sm', 'position-relative');

    // Crea una imagen para mostrar la imagen predicha
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.width = 100;
    div.appendChild(img); // Añade la imagen al div

    // Crea una lista ul para mostrar las predicciones
    const ul = document.createElement('ul');
    item.predictions.forEach(prediction => {
      // Crea un elemento li para cada predicción con la clase y la probabilidad
      const li = document.createElement('li');
      li.textContent = `${prediction.className}: ${(prediction.probability * 100).toFixed(2)}%`;
      ul.appendChild(li); // Añade el elemento li a la lista ul
    });
    div.appendChild(ul); // Añade la lista ul al div

    // Crea un botón para eliminar la predicción del historial
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm', 'position-absolute', 'top-0', 'end-0', 'm-1');
    deleteButton.addEventListener('click', () => {
      deleteFromLocalStorage(index); // Llama a la función para eliminar la predicción
      renderHistory(); // Vuelve a renderizar el historial actualizado
    });
    div.appendChild(deleteButton); // Añade el botón al div

    historyContainer.appendChild(div); // Añade el div al contenedor del historial
  });
}

// Función para eliminar una predicción del historial
function deleteFromLocalStorage(index) {
  const history = JSON.parse(localStorage.getItem('predictionHistory')) || [];
  history.splice(index, 1); // Elimina la predicción en el índice dado
  localStorage.setItem('predictionHistory', JSON.stringify(history)); // Actualiza el historial en el almacenamiento local
}

// Función para limpiar completamente el historial
function clearHistory() {
  localStorage.removeItem('predictionHistory'); // Elimina el historial del almacenamiento local
  renderHistory(); // Vuelve a renderizar el historial vacío
}

// Al cargar la página, renderiza el historial almacenado
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
});

// Función para renderizar las predicciones en la tabla de resultados
function renderPredictions(predictions) {
  const predictionsContainer = document.getElementById('predictions');
  predictionsContainer.innerHTML = ''; // Limpia el contenido actual del contenedor

  // Itera sobre cada predicción y crea filas en la tabla para mostrarlas
  predictions.forEach(prediction => {
    const row = document.createElement('tr');
    const classCell = document.createElement('td');
    classCell.textContent = prediction.className;
    const probCell = document.createElement('td');
    probCell.textContent = `${(prediction.probability * 100).toFixed(2)}%`;
    row.appendChild(classCell);
    row.appendChild(probCell);
    predictionsContainer.appendChild(row); // Añade la fila a la tabla de predicciones
  });
}

// Evento que se dispara al enviar el formulario (cuando se selecciona una imagen)
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // Evita el comportamiento por defecto del formulario (recargar la página)

  const file = imageInput.files[0]; // Obtiene el archivo de imagen seleccionado por el usuario
  if (!file) return; // Si no hay archivo, no hace nada

  const reader = new FileReader(); // Crea un lector de archivos para leer la imagen

  reader.onload = async function (e) {
    selectedImage.src = e.target.result; // Muestra la imagen seleccionada en el elemento img

    const model = await loadModel(); // Carga el modelo MobileNet
    const predictions = await classifyImage(model, selectedImage); // Clasifica la imagen usando el modelo

    saveToLocalStorage(predictions, selectedImage.src); // Guarda las predicciones en el historial local
    renderHistory(); // Renderiza el historial actualizado
    renderPredictions(predictions); // Renderiza las predicciones en la tabla de resultados
  };

  reader.readAsDataURL(file); // Lee el contenido de la imagen como una URL
});

// Botón para compartir en Twitter
document.getElementById('shareButton').addEventListener('click', () => {
  const history = JSON.parse(localStorage.getItem('predictionHistory')) || [];

  // Si no hay predicciones, muestra un mensaje de alerta y retorna
  if (history.length === 0) {
    alert('No hay predicciones para compartir.');
    return;
  }

  // Obtiene la última predicción del historial
  const latest = history[history.length - 1];

  // Crea un texto para el tweet con las predicciones más recientes
  const predictionsText = latest.predictions.map(p => `${p.className}: ${(p.probability * 100).toFixed(2)}%`).join(', ');
  const tweetText = `He usado una aplicación de reconocimiento de imágenes con TensorFlow.js y estos son mis resultados: ${predictionsText}`;

  // Crea la URL para compartir en Twitter con el texto del tweet
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  // Abre una nueva ventana del navegador para compartir en Twitter
  window.open(url, '_blank');
});

// Configura la cámara y comienza a predecir en tiempo real
async function setupCamera() {
  // Obtiene el flujo de la cámara del dispositivo
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 224, height: 224 }, // Tamaño del video
    audio: false,
  });

  const video = document.getElementById('video'); // Obtiene el elemento de video del HTML
  video.srcObject = stream; // Asigna el flujo de la cámara al elemento de video

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video); // Resuelve la promesa con el elemento de video cargado
    };
  });
}

let realTimeModel = null;
let realTimeVideo = null;
let realTimeActive = false;

// Función para predecir cada fotograma capturado por la cámara en tiempo real
async function predictFrame() {
  if (!realTimeActive) return; // Si la detección en tiempo real no está activa, retorna

  const predictions = await realTimeModel.classify(realTimeVideo); // Clasifica el fotograma capturado
  renderPredictions(predictions); // Renderiza las predicciones en la tabla de resultados

  requestAnimationFrame(predictFrame); // Pide al navegador que ejecute predictFrame en el siguiente fotograma
}

// Evento al hacer clic en el botón para iniciar la detección en tiempo real
document.getElementById('startRealTimeButton').addEventListener('click', async () => {
  realTimeModel = await loadModel(); // Carga el modelo MobileNet para detección en tiempo real
  realTimeVideo = await setupCamera(); // Configura la cámara para capturar imágenes en tiempo real
  realTimeActive = true; // Activa la detección en tiempo real
  predictFrame(); // Comienza a predecir fotogramas en tiempo real
});

// Evento al hacer clic en el botón para detener la detección en tiempo real
document.getElementById('stopRealTimeButton').addEventListener('click', () => {
  realTimeActive = false; // Desactiva la detección en tiempo real

  // Si hay un video activo y tiene un flujo de cámara, detiene el flujo de la cámara
  if (realTimeVideo && realTimeVideo.srcObject) {
    realTimeVideo.srcObject.getTracks().forEach(track => track.stop());
  }
});

// Evento al hacer clic en el botón para vaciar el historial de predicciones
document.getElementById('clearHistoryButton').addEventListener('click', () => {
  clearHistory(); // Llama a la función para limpiar el historial de predicciones
});
