/**
 * EventPass — Creación de los 11 archivos de Google Sheets con datos de prueba.
 *
 * Cómo usarlo:
 *   1. Entra a https://script.google.com → Nuevo proyecto.
 *   2. Pega TODO este archivo y guarda.
 *   3. Selecciona la función crearHojasEventPass y pulsa Ejecutar (acepta los permisos).
 *   4. Abre "Registro de ejecución": verás el JSON con los IDs. Cópialo en n8n/ids.json.
 *
 * Crea la carpeta "EventPass — Google Sheets" en tu Drive con EP01…EP11, una hoja por pestaña,
 * encabezados en la fila 1 y formato de texto plano (evita que Sheets convierta fechas o IDs).
 * Las fechas de los eventos se calculan desde el día en que lo ejecutas.
 * Contraseña de todos los usuarios de prueba: EventPass2026!
 */

const ESQUEMA = {
  "EP01_Usuarios": {
    "Usuarios": [
      "usuario_id",
      "nombre",
      "email_normalizado",
      "password_hash",
      "password_salt",
      "estado",
      "fecha_registro",
      "fecha_actualizacion"
    ],
    "Auditoria_Usuarios": [
      "auditoria_id",
      "usuario_id",
      "accion",
      "fecha",
      "resultado",
      "detalle"
    ]
  },
  "EP02_Sesiones": {
    "Sesiones": [
      "session_id",
      "usuario_id",
      "session_token",
      "creada_en",
      "expira_en",
      "estado",
      "cerrada_en",
      "ultima_validacion"
    ]
  },
  "EP03_Telegram": {
    "Codigos_Vinculacion": [
      "codigo_id",
      "usuario_id",
      "codigo",
      "creado_en",
      "expira_en",
      "estado",
      "usado_en"
    ],
    "Vinculaciones": [
      "vinculacion_id",
      "usuario_id",
      "chat_id",
      "telegram_username",
      "fecha_vinculacion",
      "estado"
    ]
  },
  "EP04_Eventos": {
    "Eventos": [
      "evento_id",
      "nombre",
      "categoria",
      "grupo_edad",
      "descripcion",
      "fecha",
      "hora",
      "lugar",
      "capacidad",
      "imagen_url",
      "organizador",
      "estado",
      "motivo_estado",
      "fecha_creacion",
      "fecha_actualizacion"
    ],
    "Auditoria_Eventos": [
      "auditoria_id",
      "evento_id",
      "accion",
      "fecha",
      "resultado",
      "detalle"
    ]
  },
  "EP05_Catalogo_Log": {
    "Consultas_Catalogo": [
      "consulta_id",
      "fecha",
      "tipo",
      "evento_id",
      "categoria",
      "resultado_count",
      "visitor_id",
      "status_http"
    ]
  },
  "EP06_Inscripciones": {
    "Inscripciones": [
      "inscripcion_id",
      "usuario_id",
      "evento_id",
      "estado",
      "fecha_inscripcion",
      "fecha_actualizacion",
      "nombre_acreditacion",
      "observaciones",
      "origen",
      "orden_espera"
    ],
    "Auditoria_Inscripciones": [
      "auditoria_id",
      "inscripcion_id",
      "usuario_id",
      "evento_id",
      "accion",
      "estado_anterior",
      "estado_nuevo",
      "fecha",
      "resultado",
      "detalle"
    ]
  },
  "EP07_Reasignaciones": {
    "Reasignaciones": [
      "reasignacion_id",
      "evento_id",
      "inscripcion_id",
      "usuario_id",
      "fecha",
      "orden_lista",
      "estado_anterior",
      "estado_nuevo",
      "resultado_notificacion"
    ]
  },
  "EP08_Recordatorios": {
    "Recordatorios": [
      "recordatorio_id",
      "usuario_id",
      "evento_id",
      "inscripcion_id",
      "tipo_recordatorio",
      "fecha_programada",
      "fecha_envio",
      "estado",
      "clave_idempotencia"
    ]
  },
  "EP09_Notificaciones": {
    "Notificaciones": [
      "notificacion_id",
      "usuario_id",
      "tipo",
      "titulo",
      "mensaje",
      "evento_id",
      "inscripcion_id",
      "fecha",
      "gmail_estado",
      "telegram_estado",
      "gmail_error",
      "telegram_error",
      "clave_idempotencia"
    ]
  },
  "EP10_Soporte": {
    "Conversaciones": [
      "conversation_id",
      "usuario_id",
      "visitor_id",
      "fecha_inicio",
      "fecha_ultima_interaccion",
      "estado"
    ],
    "Mensajes": [
      "message_id",
      "conversation_id",
      "usuario_id",
      "visitor_id",
      "rol",
      "mensaje",
      "timestamp"
    ]
  },
  "EP11_Checkin": {
    "Checkins": [
      "checkin_id",
      "inscripcion_id",
      "evento_id",
      "usuario_id",
      "fecha_checkin",
      "resultado",
      "detalle"
    ]
  }
};

// Datos de prueba de EventPass. Las fechas son relativas al momento de ejecución
// para que siempre exista un evento próximo (mañana) y los demás queden en el futuro.
const SEMILLA_USUARIOS = [
  {
    "usuario_id": "USR-DEMO01",
    "nombre": "Valentina Rojas",
    "email_normalizado": "valentina.rojas@example.com",
    "password_hash": "4dc1c3f641e138c76e84e265804cedea61ee9864e098a7b9f3f86aad61c76598",
    "password_salt": "937beac4fb273b3b14cd56e10d30ee81",
    "estado": "ACTIVO",
    "dias_registro": -59
  },
  {
    "usuario_id": "USR-DEMO02",
    "nombre": "Santiago Duarte",
    "email_normalizado": "santiago.duarte@example.com",
    "password_hash": "4f4f084ca4058770c825b9b3395bdbb45c0718dccca3d56ca6d5b4cf32052cc0",
    "password_salt": "100847d08c5d231332dd049781c16543",
    "estado": "ACTIVO",
    "dias_registro": -58
  },
  {
    "usuario_id": "USR-DEMO03",
    "nombre": "Camila Pinzón",
    "email_normalizado": "camila.pinzon@example.com",
    "password_hash": "b74a24e169d3fa588b0534df2cf4da0928881ad9e445de16288760b2bec6908b",
    "password_salt": "b5cc51122568ff7aa3bdcd88d2e77efa",
    "estado": "ACTIVO",
    "dias_registro": -57
  },
  {
    "usuario_id": "USR-DEMO04",
    "nombre": "Andrés Becerra",
    "email_normalizado": "andres.becerra@example.com",
    "password_hash": "544c8e0e8bb2ec207ea037c2d83830a32276d7d0d217f5c0df068756aeff7774",
    "password_salt": "bd5cb13d1492025da048b917f8b3fe6a",
    "estado": "ACTIVO",
    "dias_registro": -56
  },
  {
    "usuario_id": "USR-DEMO05",
    "nombre": "Laura Quintero",
    "email_normalizado": "laura.quintero@example.com",
    "password_hash": "e406533252bcd139ffd742d2433dce5f54c1a065cb732bc817ff2e3dff7385b3",
    "password_salt": "c47bd3d05d8c09358fe84af9f35bcf4f",
    "estado": "ACTIVO",
    "dias_registro": -55
  },
  {
    "usuario_id": "USR-DEMO06",
    "nombre": "Julián Mantilla",
    "email_normalizado": "julian.mantilla@example.com",
    "password_hash": "3b01f2aa7fe080501a079400cc7a604e5ebd5da44affe0901c8c388fb0180471",
    "password_salt": "64c5e311bcb22e9697d4c9f6161d846f",
    "estado": "ACTIVO",
    "dias_registro": -54
  },
  {
    "usuario_id": "USR-DEMO07",
    "nombre": "Daniela Ardila",
    "email_normalizado": "daniela.ardila@example.com",
    "password_hash": "9fe945a5ac31e3824e91539f5afd0858d8032284af88240e892d71c42dda50b8",
    "password_salt": "7fbbc88fc51a52d706df68ced94bf9cf",
    "estado": "ACTIVO",
    "dias_registro": -53
  },
  {
    "usuario_id": "USR-DEMO08",
    "nombre": "Felipe Gómez",
    "email_normalizado": "felipe.gomez@example.com",
    "password_hash": "757e3725dd4362304fa3bef4ae4964e067290837f0021bf871ac6bf4816ea67c",
    "password_salt": "04de3e86abffdf7a8a4d099c8c68abe1",
    "estado": "ACTIVO",
    "dias_registro": -52
  },
  {
    "usuario_id": "USR-DEMO09",
    "nombre": "Mariana Serrano",
    "email_normalizado": "mariana.serrano@example.com",
    "password_hash": "d90e1e7e3115d1f64138037e8a46aed7f258915a49e7163cbe5651f4fc40f493",
    "password_salt": "5aaa3226d6f0bdf659635cbe3a6dadd4",
    "estado": "ACTIVO",
    "dias_registro": -51
  },
  {
    "usuario_id": "USR-DEMO10",
    "nombre": "Sebastián Prada",
    "email_normalizado": "sebastian.prada@example.com",
    "password_hash": "68510a8746653cd0d291dbebc72fb97d3711b7212a0df97de6cd97c7cf6a8644",
    "password_salt": "f02c713f9e9450b3cdb2b61119ec1ec3",
    "estado": "ACTIVO",
    "dias_registro": -50
  },
  {
    "usuario_id": "USR-DEMO11",
    "nombre": "Natalia Ortiz",
    "email_normalizado": "natalia.ortiz@example.com",
    "password_hash": "21206e7a8aba64c37519c189cf447e46bee4eb8fcf3086d66623005d0e5fc67b",
    "password_salt": "6b409fd8bce3926eba453af1c5072bf2",
    "estado": "ACTIVO",
    "dias_registro": -49
  },
  {
    "usuario_id": "USR-DEMO12",
    "nombre": "Mateo Villamizar",
    "email_normalizado": "mateo.villamizar@example.com",
    "password_hash": "68bfc7789704068a56e4ad9449c95f95b846294a05ef92945c71a80b47c5dea6",
    "password_salt": "cc5791a96da19e9f379478b15af41ad0",
    "estado": "ACTIVO",
    "dias_registro": -48
  },
  {
    "usuario_id": "USR-DEMO13",
    "nombre": "Isabella Rueda",
    "email_normalizado": "isabella.rueda@example.com",
    "password_hash": "e31a2e1bd50fed03b55bcb64daa4b67cab8d64686abeea69d3b89a611337fdbf",
    "password_salt": "59f73d635c424b1ef0492a6fe5e84bef",
    "estado": "ACTIVO",
    "dias_registro": -47
  },
  {
    "usuario_id": "USR-DEMO14",
    "nombre": "Tomás Galvis",
    "email_normalizado": "tomas.galvis@example.com",
    "password_hash": "f0371957e75e6840531609116f8490726ed87a481c3bdfeef18340f247de8bb6",
    "password_salt": "e1e2af346ebff8be04bf853905052160",
    "estado": "INACTIVO",
    "dias_registro": -46
  }
];
const SEMILLA_EVENTOS = [
  {
    "evento_id": "EVT-NAT-ADU",
    "nombre": "Copa Máster de Natación 50 m",
    "categoria": "Natación",
    "grupo_edad": "Adultos",
    "dias": 12,
    "hora": "07:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Club Delfines del Oriente",
    "descripcion": "Series contrarreloj de 50 m libre, espalda y pecho para nadadores mayores de 18 años. Incluye toma de tiempos electrónica.",
    "lugar": "Complejo Acuático Municipal, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-NAT-NIN",
    "nombre": "Festival Pececitos 25 m",
    "categoria": "Natación",
    "grupo_edad": "Niños",
    "dias": 9,
    "hora": "09:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Club Delfines del Oriente",
    "descripcion": "Primer festival de natación para niñas y niños de 6 a 12 años. Pruebas de 25 m con acompañamiento de instructores.",
    "lugar": "Complejo Acuático Municipal, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-ATL-ADU",
    "nombre": "Carrera 10K Ciudad Bonita",
    "categoria": "Atletismo",
    "grupo_edad": "Adultos",
    "dias": 20,
    "hora": "06:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Corredores de Santander",
    "descripcion": "Recorrido urbano de 10 km con hidratación cada 2,5 km, chip de tiempo y medalla de finalista.",
    "lugar": "Pista Atlética de la Villa Olímpica, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-ATL-NIN",
    "nombre": "Mini Olimpiada de Atletismo",
    "categoria": "Atletismo",
    "grupo_edad": "Niños",
    "dias": 1,
    "hora": "09:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Escuela Atlética Pies Ligeros",
    "descripcion": "Relevos, salto largo y carreras de 60 m para niñas y niños de 7 a 12 años. Cada participante recibe una medalla.",
    "lugar": "Pista Atlética de la Villa Olímpica, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-CIC-ADU",
    "nombre": "Gran Fondo Mesa de los Santos",
    "categoria": "Ciclismo",
    "grupo_edad": "Adultos",
    "dias": 6,
    "hora": "05:30",
    "estado": "CANCELADO",
    "motivo_estado": "Alerta por lluvias fuertes y riesgo de deslizamientos en la vía a la Mesa de los Santos.",
    "organizador": "Ruta Andina Ciclismo",
    "descripcion": "Recorrido de 85 km con 1.900 m de ascenso, puntos de abastecimiento y carro escoba.",
    "lugar": "Parque Recreacional El Lago, Floridablanca",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-CIC-NIN",
    "nombre": "Rodada Infantil Escuela de Bici",
    "categoria": "Ciclismo",
    "grupo_edad": "Niños",
    "dias": 14,
    "hora": "08:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Ruta Andina Ciclismo",
    "descripcion": "Circuito cerrado de 3 km para niños de 5 a 11 años con casco obligatorio y talleres de seguridad vial.",
    "lugar": "Parque Recreacional El Lago, Floridablanca",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-KAR-ADU",
    "nombre": "Open de Karate Kumite",
    "categoria": "Karate",
    "grupo_edad": "Adultos",
    "dias": 16,
    "hora": "10:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Dojo Shotokan Santander",
    "descripcion": "Combates de kumite por categorías de peso para cinturones verdes en adelante. Arbitraje oficial.",
    "lugar": "Coliseo Bicentenario, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-KAR-NIN",
    "nombre": "Torneo Infantil de Kata",
    "categoria": "Karate",
    "grupo_edad": "Niños",
    "dias": 10,
    "hora": "09:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Dojo Shotokan Santander",
    "descripcion": "Presentación de katas por grados para niñas y niños de 6 a 13 años, con diploma para todos.",
    "lugar": "Coliseo Bicentenario, Bucaramanga",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-CRO-ADU",
    "nombre": "Desafío CrossFit por Parejas",
    "categoria": "CrossFit",
    "grupo_edad": "Adultos",
    "dias": 8,
    "hora": "07:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Box Cañón Fitness",
    "descripcion": "Tres WODs en pareja con escalado RX e intermedio. Varios participantes cancelaron: hay cupo para la lista de espera.",
    "lugar": "Box Cañón Fitness, Girón",
    "capacidad": "10",
    "imagen_url": ""
  },
  {
    "evento_id": "EVT-CRO-NIN",
    "nombre": "CrossFit Kids: Juegos en Familia",
    "categoria": "CrossFit",
    "grupo_edad": "Niños",
    "dias": 18,
    "hora": "16:00",
    "estado": "PUBLICADO",
    "motivo_estado": "",
    "organizador": "Box Cañón Fitness",
    "descripcion": "Circuitos de juego y movimiento funcional para niños de 6 a 12 años, con participación de las familias.",
    "lugar": "Box Cañón Fitness, Girón",
    "capacidad": "10",
    "imagen_url": ""
  }
];
const SEMILLA_INSCRIPCIONES = [
  {
    "inscripcion_id": "INS-DEMO001",
    "usuario_id": "USR-DEMO01",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 400,
    "nombre_acreditacion": "Valentina Rojas",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO002",
    "usuario_id": "USR-DEMO02",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 393,
    "nombre_acreditacion": "Santiago Duarte",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO003",
    "usuario_id": "USR-DEMO03",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 386,
    "nombre_acreditacion": "Camila Pinzón",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO004",
    "usuario_id": "USR-DEMO04",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 379,
    "nombre_acreditacion": "Andrés Becerra",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO005",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 372,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO006",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 365,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO007",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 358,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO008",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 351,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO009",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 344,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO010",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-NAT-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 337,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO011",
    "usuario_id": "USR-DEMO11",
    "evento_id": "EVT-NAT-ADU",
    "estado": "LISTA_ESPERA",
    "horas_atras": 330,
    "nombre_acreditacion": "Natalia Ortiz",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": "1"
  },
  {
    "inscripcion_id": "INS-DEMO012",
    "usuario_id": "USR-DEMO12",
    "evento_id": "EVT-NAT-ADU",
    "estado": "LISTA_ESPERA",
    "horas_atras": 323,
    "nombre_acreditacion": "Mateo Villamizar",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": "2"
  },
  {
    "inscripcion_id": "INS-DEMO013",
    "usuario_id": "USR-DEMO02",
    "evento_id": "EVT-NAT-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 399,
    "nombre_acreditacion": "Santiago Duarte",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO014",
    "usuario_id": "USR-DEMO03",
    "evento_id": "EVT-NAT-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 392,
    "nombre_acreditacion": "Camila Pinzón",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO015",
    "usuario_id": "USR-DEMO04",
    "evento_id": "EVT-NAT-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 385,
    "nombre_acreditacion": "Andrés Becerra",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO016",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-NAT-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 378,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO017",
    "usuario_id": "USR-DEMO03",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 398,
    "nombre_acreditacion": "Camila Pinzón",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO018",
    "usuario_id": "USR-DEMO04",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 391,
    "nombre_acreditacion": "Andrés Becerra",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO019",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 384,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO020",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 377,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO021",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 370,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO022",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-ATL-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 363,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO023",
    "usuario_id": "USR-DEMO04",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 397,
    "nombre_acreditacion": "Andrés Becerra",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO024",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 390,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO025",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 383,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO026",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 376,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO027",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 369,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO028",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 362,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO029",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-ATL-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 355,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO030",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-CIC-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 396,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO031",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-CIC-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 389,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO032",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-CIC-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 382,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO033",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-CIC-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 375,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO034",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-CIC-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 368,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO035",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-CIC-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 395,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO036",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-CIC-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 388,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO037",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-CIC-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 381,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO038",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 394,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO039",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 387,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO040",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 380,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO041",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 373,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO042",
    "usuario_id": "USR-DEMO11",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 366,
    "nombre_acreditacion": "Natalia Ortiz",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO043",
    "usuario_id": "USR-DEMO12",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 359,
    "nombre_acreditacion": "Mateo Villamizar",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO044",
    "usuario_id": "USR-DEMO13",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 352,
    "nombre_acreditacion": "Isabella Rueda",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO045",
    "usuario_id": "USR-DEMO01",
    "evento_id": "EVT-KAR-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 345,
    "nombre_acreditacion": "Valentina Rojas",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO046",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-KAR-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 393,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO047",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-KAR-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 386,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO048",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-KAR-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 379,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO049",
    "usuario_id": "USR-DEMO11",
    "evento_id": "EVT-KAR-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 372,
    "nombre_acreditacion": "Natalia Ortiz",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO050",
    "usuario_id": "USR-DEMO12",
    "evento_id": "EVT-KAR-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 365,
    "nombre_acreditacion": "Mateo Villamizar",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO051",
    "usuario_id": "USR-DEMO09",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 392,
    "nombre_acreditacion": "Mariana Serrano",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO052",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 385,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO053",
    "usuario_id": "USR-DEMO11",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 378,
    "nombre_acreditacion": "Natalia Ortiz",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO054",
    "usuario_id": "USR-DEMO12",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 371,
    "nombre_acreditacion": "Mateo Villamizar",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO055",
    "usuario_id": "USR-DEMO13",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 364,
    "nombre_acreditacion": "Isabella Rueda",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO056",
    "usuario_id": "USR-DEMO01",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 357,
    "nombre_acreditacion": "Valentina Rojas",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO057",
    "usuario_id": "USR-DEMO02",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 350,
    "nombre_acreditacion": "Santiago Duarte",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO058",
    "usuario_id": "USR-DEMO03",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 343,
    "nombre_acreditacion": "Camila Pinzón",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO059",
    "usuario_id": "USR-DEMO04",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CONFIRMADA",
    "horas_atras": 336,
    "nombre_acreditacion": "Andrés Becerra",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO060",
    "usuario_id": "USR-DEMO05",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CANCELADA",
    "horas_atras": 329,
    "nombre_acreditacion": "Laura Quintero",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO061",
    "usuario_id": "USR-DEMO06",
    "evento_id": "EVT-CRO-ADU",
    "estado": "CANCELADA",
    "horas_atras": 322,
    "nombre_acreditacion": "Julián Mantilla",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO062",
    "usuario_id": "USR-DEMO07",
    "evento_id": "EVT-CRO-ADU",
    "estado": "LISTA_ESPERA",
    "horas_atras": 315,
    "nombre_acreditacion": "Daniela Ardila",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": "1"
  },
  {
    "inscripcion_id": "INS-DEMO063",
    "usuario_id": "USR-DEMO08",
    "evento_id": "EVT-CRO-ADU",
    "estado": "LISTA_ESPERA",
    "horas_atras": 308,
    "nombre_acreditacion": "Felipe Gómez",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": "2"
  },
  {
    "inscripcion_id": "INS-DEMO064",
    "usuario_id": "USR-DEMO10",
    "evento_id": "EVT-CRO-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 391,
    "nombre_acreditacion": "Sebastián Prada",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  },
  {
    "inscripcion_id": "INS-DEMO065",
    "usuario_id": "USR-DEMO11",
    "evento_id": "EVT-CRO-NIN",
    "estado": "CONFIRMADA",
    "horas_atras": 384,
    "nombre_acreditacion": "Natalia Ortiz",
    "observaciones": "",
    "origen": "SEMILLA",
    "orden_espera": ""
  }
];

function construirSemilla(ahora) {
  const fechaBogota = (dias) => {
    const d = new Date(ahora.getTime() + dias * 86400000);
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  };
  const hace = (horas) => new Date(ahora.getTime() - horas * 3600000).toISOString();
  const creado = hace(24 * 30);
  return {
    EP01_Usuarios: {
      Usuarios: SEMILLA_USUARIOS.map((u) => ({
        usuario_id: u.usuario_id, nombre: u.nombre, email_normalizado: u.email_normalizado,
        password_hash: u.password_hash, password_salt: u.password_salt, estado: u.estado,
        fecha_registro: hace(-u.dias_registro * 24), fecha_actualizacion: hace(-u.dias_registro * 24),
      })),
    },
    EP04_Eventos: {
      Eventos: SEMILLA_EVENTOS.map((e) => ({
        evento_id: e.evento_id, nombre: e.nombre, categoria: e.categoria, grupo_edad: e.grupo_edad,
        descripcion: e.descripcion, fecha: fechaBogota(e.dias), hora: e.hora, lugar: e.lugar, capacidad: e.capacidad,
        imagen_url: e.imagen_url, organizador: e.organizador, estado: e.estado, motivo_estado: e.motivo_estado,
        fecha_creacion: creado, fecha_actualizacion: creado,
      })),
    },
    EP06_Inscripciones: {
      Inscripciones: SEMILLA_INSCRIPCIONES.map((i) => ({
        inscripcion_id: i.inscripcion_id, usuario_id: i.usuario_id, evento_id: i.evento_id, estado: i.estado,
        fecha_inscripcion: hace(i.horas_atras), fecha_actualizacion: hace(i.horas_atras),
        nombre_acreditacion: i.nombre_acreditacion, observaciones: i.observaciones, origen: i.origen,
        orden_espera: i.orden_espera,
      })),
    },
  };
}

function crearHojasEventPass() {
  const carpeta = DriveApp.createFolder('EventPass — Google Sheets');
  const semilla = construirSemilla(new Date());
  const ids = {};
  Object.keys(ESQUEMA).forEach((archivo) => {
    const libro = SpreadsheetApp.create(archivo);
    DriveApp.getFileById(libro.getId()).moveTo(carpeta);
    Object.keys(ESQUEMA[archivo]).forEach((nombreHoja, indice) => {
      const hoja = indice === 0 ? libro.getSheets()[0].setName(nombreHoja) : libro.insertSheet(nombreHoja);
      const columnas = ESQUEMA[archivo][nombreHoja];
      hoja.getRange(1, 1, hoja.getMaxRows(), columnas.length).setNumberFormat('@');
      hoja.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold').setBackground('#13202e').setFontColor('#ffffff');
      hoja.setFrozenRows(1);
      const filas = (semilla[archivo] && semilla[archivo][nombreHoja]) || [];
      if (filas.length) {
        hoja.getRange(2, 1, filas.length, columnas.length)
          .setValues(filas.map((fila) => columnas.map((c) => (fila[c] === undefined || fila[c] === null ? '' : String(fila[c])))));
      }
      hoja.autoResizeColumns(1, columnas.length);
    });
    ids[archivo] = libro.getId();
  });
  ids.WF09 = 'ID_DEL_WORKFLOW_WF09_EN_N8N';
  Logger.log('Copia este JSON en n8n/ids.json:\n' + JSON.stringify(ids, null, 2));
  Logger.log('Carpeta: ' + carpeta.getUrl());
}
