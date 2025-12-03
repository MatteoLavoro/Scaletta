import { useState, useEffect } from "react";
import { Modal } from "../modal";
import { TextField, PasswordField, FormSection, FormError } from "../form";
import { registerUser, loginUser } from "../../services/auth";
import {
  getAuthErrorMessage,
  validateEmail,
  validateUsername,
  validatePassword,
} from "../../utils/authValidation";

/**
 * AuthModal - Modale di autenticazione (login/registrazione)
 * Utilizza i componenti standard Modal e Form
 */
const AuthModal = ({ isOpen, initialMode = "login" }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === "login";

  // Reset quando cambia initialMode
  useEffect(() => {
    setMode(initialMode);
    resetForm();
  }, [initialMode]);

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
    setError("");
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    resetForm();
  };

  const validate = () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return false;
    }

    if (!isLogin) {
      const usernameError = validateUsername(username);
      if (usernameError) {
        setError(usernameError);
        return false;
      }
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, username.trim());
      }
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const isFormValid = isLogin
    ? email.trim() && password
    : email.trim() && username.trim() && password;

  return (
    <Modal
      isOpen={isOpen}
      title={isLogin ? "Accedi" : "Crea Account"}
      confirmText={isLogin ? "Accedi" : "Registrati"}
      onConfirm={handleSubmit}
      confirmDisabled={!isFormValid}
      isLoading={isLoading}
    >
      <FormSection>
        {/* Errore globale */}
        <FormError message={error} variant="box" className="mb-1" />

        {/* Campi form */}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="esempio@email.com"
          autoComplete="email"
          autoCapitalize="none"
        />

        {!isLogin && (
          <TextField
            label="Nome utente"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Il tuo nome utente"
            autoComplete="username"
          />
        )}

        <PasswordField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="La tua password"
          autoComplete={isLogin ? "current-password" : "new-password"}
        />

        {/* Switch login/registrazione */}
        <div className="flex items-center justify-center gap-1.5 pt-3">
          <span className="text-sm text-text-secondary">
            {isLogin ? "Non hai un account?" : "Hai già un account?"}
          </span>
          <button
            type="button"
            onClick={switchMode}
            className="text-sm font-semibold text-primary px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
          >
            {isLogin ? "Registrati" : "Accedi"}
          </button>
        </div>
      </FormSection>
    </Modal>
  );
};

export default AuthModal;
