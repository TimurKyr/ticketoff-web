// UI strings. Russian is the source language; other languages may be partial
// and fall back to Russian for missing keys.
export const ru = {
  "app.name": "ticketoff",
  "nav.events": "События",
  "nav.tickets": "Мои билеты",
  "nav.organizer": "Кабинет организатора",
  "nav.admin": "Админка",
  "nav.account": "Профиль",
  "nav.login": "Войти",
  "nav.register": "Регистрация",
  "nav.logout": "Выйти",
  "nav.language": "Язык",

  "common.loading": "Загрузка…",
  "common.error": "Что-то пошло не так. Попробуйте ещё раз.",
  "common.networkError": "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.",

  "auth.email": "Email",
  "auth.password": "Пароль",
  "auth.passwordRepeat": "Повторите пароль",
  "auth.passwordHint": "Не короче 8 символов",
  "auth.login.title": "Вход",
  "auth.login.submit": "Войти",
  "auth.login.noAccount": "Нет аккаунта?",
  "auth.login.toRegister": "Зарегистрироваться",
  "auth.login.invalid": "Неверный email или пароль",
  "auth.register.title": "Регистрация",
  "auth.register.submit": "Создать аккаунт",
  "auth.register.haveAccount": "Уже есть аккаунт?",
  "auth.register.toLogin": "Войти",
  "auth.register.emailTaken": "Этот email уже зарегистрирован",
  "auth.validation.emailRequired": "Введите email",
  "auth.validation.emailInvalid": "Неверный формат email",
  "auth.validation.passwordShort": "Пароль должен быть не короче 8 символов",
  "auth.validation.passwordMismatch": "Пароли не совпадают",
  "auth.sessionExpired": "Сессия истекла, войдите снова",

  "account.title": "Профиль",
  "account.role": "Роль",
  "account.role.attendee": "Участник",
  "account.role.platform_admin": "Администратор платформы",
  "account.emailVerified": "Email подтверждён",
  "account.emailNotVerified": "Email не подтверждён",
  "account.organizer": "Организатор",
  "account.organizer.yes": "Да, профиль организатора создан",
  "account.organizer.no": "Нет",
  "account.becomeOrganizer.title": "Стать организатором",
  "account.becomeOrganizer.text":
    "Профиль организатора позволяет создавать события и продавать билеты.",
  "account.becomeOrganizer.name": "Название организатора",
  "account.becomeOrganizer.submit": "Стать организатором",
  "account.becomeOrganizer.nameRequired": "Введите название",
  "account.becomeOrganizer.exists": "Профиль организатора уже создан",
  "account.becomeOrganizer.done": "Готово: теперь вам доступен кабинет организатора.",

  "guard.forbidden.title": "Нет доступа",
  "guard.forbidden.organizer":
    "Эта страница только для организаторов. Создайте профиль организатора в разделе «Профиль».",
  "guard.forbidden.admin": "Эта страница только для администраторов платформы.",

  "notFound.title": "Страница не найдена",
  "notFound.home": "На главную",
} as const;

export type MessageKey = keyof typeof ru;
export type Messages = Partial<Record<MessageKey, string>>;

export const kk: Messages = {
  "nav.events": "Іс-шаралар",
  "nav.tickets": "Менің билеттерім",
  "nav.organizer": "Ұйымдастырушы кабинеті",
  "nav.admin": "Әкімші",
  "nav.account": "Профиль",
  "nav.login": "Кіру",
  "nav.register": "Тіркелу",
  "nav.logout": "Шығу",
  "nav.language": "Тіл",
  "common.loading": "Жүктелуде…",
  "common.error": "Қате орын алды. Қайталап көріңіз.",
  "auth.email": "Email",
  "auth.password": "Құпиясөз",
  "auth.passwordRepeat": "Құпиясөзді қайталаңыз",
  "auth.login.title": "Кіру",
  "auth.login.submit": "Кіру",
  "auth.passwordHint": "Кемінде 8 таңба",
  "auth.login.invalid": "Email немесе құпиясөз қате",
  "auth.login.noAccount": "Аккаунтыңыз жоқ па?",
  "auth.login.toRegister": "Тіркелу",
  "auth.register.title": "Тіркелу",
  "auth.register.submit": "Аккаунт ашу",
  "auth.register.haveAccount": "Аккаунтыңыз бар ма?",
  "auth.register.toLogin": "Кіру",
  "auth.validation.passwordMismatch": "Құпиясөздер сәйкес келмейді",
  "notFound.title": "Бет табылмады",
  "notFound.home": "Басты бетке",
  "account.title": "Профиль",
  "account.becomeOrganizer.title": "Ұйымдастырушы болу",
  "account.becomeOrganizer.submit": "Ұйымдастырушы болу",
};

export const LANGUAGES = { ru, kk } as const;
export type Language = keyof typeof LANGUAGES;
export const LANGUAGE_LABELS: Record<Language, string> = { ru: "Рус", kk: "Қаз" };
