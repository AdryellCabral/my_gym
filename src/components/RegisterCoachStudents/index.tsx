import PersonIcon from "@material-ui/icons/Person";
import EmailIcon from "@material-ui/icons/Email";
import SchoolIcon from "@material-ui/icons/School";
import LockIcon from "@material-ui/icons/Lock";

import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { ContainerForm } from "./styles";
import GreenButton from "../GreenButton";
import Input from "../Input";

import React, { useRef, useState } from "react";
import { useAcademy } from "../../providers/Academy";
import { apiMyGym } from "../../services/api";
import jwtDecode from "jwt-decode";
import { toast, Zoom, Slide, Flip } from "react-toastify";
import { ToastRegister } from "../Toasts/Register";
import "react-toastify/dist/ReactToastify.css";
import { useUserProvider } from "../../providers/User";
import { ToastLoading } from "../Toasts/Loading";

interface Decoded {
  email: string;
  iat: number;
  exp: number;
  sub: string;
}

interface Data {
  name: string;
  email: string;
  coachId?: number;
  cref?: string;
  password: string;
  passwordConfirm: string;
}

interface CoachMapProps {
  name: string;
  email: string;
  cref: string;
  academyId: number;
  userId: string;
  id: number;
}
interface RegisterCoachStudentsProps {
  user: string;
}

export const RegisterCoachStudents = ({ user }: RegisterCoachStudentsProps) => {
  const { academyResume, loadInfoAcademy } = useAcademy();
  const [coachValue, setCoachValue] = useState("");
  const { userProvider } = useUserProvider();
  const formSchema = yup.object().shape({
    name: yup.string().required("Campo obrigatório!"),
    email: yup.string().required("Campo obrigatório!").email("Email inválido!"),
    cref: yup
      .string()
      .when(user, (user, schema) =>
        user === "coach"
          ? schema.required("Campo obrigatório!")
          : schema.notRequired()
      ),
    coachId: yup
      .number()
      .when(user, (user, schema) =>
        user === "student"
          ? schema.required("Campo obrigatório!")
          : schema.notRequired()
      ),
    password: yup
      .string()
      .required("Campo obrigatório!")
      .min(6, "Mínimo de 6 dígitos!"),
    passwordConfirm: yup
      .string()
      .required("Campo obrigatório!")
      .oneOf([yup.ref("password")], "As senhas estão diferentes."),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Data>({
    resolver: yupResolver(formSchema),
  });

  const handleChange = (event: string) => {
    setCoachValue(event);
  };
  const toastId = React.useRef<string | number>("");

  const postStudent = (data: Data, id: string) => {
    const { name, email, coachId } = data;
    const newData = {
      name,
      email,
      coachId,
      academyId: academyResume.id,
      userId: parseInt(id),
    };

    apiMyGym
      .post("students", newData, {
        headers: {
          Authorization: `Bearer ${userProvider.token}`,
        },
      })
      .then((response) => {
        toast.update(toastId.current, {
          render: (
            <ToastRegister name={data.name} closeToast={true} toastProps={null}>
              agora é um Aluno da sua Academia!
            </ToastRegister>
          ),
          className: "registerSuccess",
          transition: Flip,
        });
        loadInfoAcademy();
      });
  };

  const postCoach = (data: Data, id: string) => {
    const { name, email, cref } = data;
    const newData = {
      name,
      email,
      cref,
      academyId: academyResume.id,
      userId: parseInt(id),
    };
    apiMyGym
      .post("coaches", newData, {
        headers: {
          Authorization: `Bearer ${userProvider.token}`,
        },
      })
      .then((response) => {
        toast.update(toastId.current, {
          render: (
            <ToastRegister name={data.name} closeToast={true} toastProps={null}>
              agora é um Coach na sua Academia!
            </ToastRegister>
          ),
          className: "registerSuccess",
          transition: Flip,
        });
        loadInfoAcademy();
      });
  };

  const onSubmit = (data: Data) => {
    const { email, password } = data;

    const newData = { email, password };

    toastId.current = toast(<ToastLoading >Aguarde enquanto criamos a conta.</ToastLoading>, { className: "loadingToast" });

    apiMyGym
      .post("register", newData)
      .then((response) => {
        const { sub } = jwtDecode<Decoded>(response.data.accessToken);
        if (user === "coach") {
          postCoach(data, sub);
        } else {
          postStudent(data, sub);
        }
      })
      .catch((error) =>
        toast(
          <ToastRegister name={data.email} closeToast={true} toastProps={null}>
            E-mail já cadastrado. Tente outro.
          </ToastRegister>,
          { className: "registerFail" }
        )
      );
  };

  return (
    <ContainerForm>
      <form onSubmit={handleSubmit(onSubmit)}>
        {user === "coach" ? (
          <h1>Registro de Coach</h1>
        ) : (
          <h1>Registro de Aluno</h1>
        )}
        <Input label="Nome" {...register("name")}>
          <PersonIcon />
        </Input>
        <p>{errors.name?.message}</p>

        <Input label="E-mail" {...register("email")}>
          <EmailIcon />
        </Input>
        <p>{errors.email?.message}</p>

        {user === "student" ? (
          <>
            <select
              value={coachValue}
              {...register("coachId")}
              onChange={(evt) => handleChange(evt.target.value)}
              id="coach"
            >
              {academyResume?.coaches?.map((coach: CoachMapProps) => (
                <option key={coach.name} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </select>
            <p>{errors.coachId?.message}</p>
          </>
        ) : (
          <>
            <Input label="CREF" {...register("cref")}>
              <SchoolIcon />
            </Input>
            <p>{errors.cref?.message}</p>
          </>
        )}

        <Input label="Senha" {...register("password")} type="password">
          <LockIcon />
        </Input>
        <p>{errors.password?.message}</p>

        <Input
          label="Confirmar Senha"
          {...register("passwordConfirm")}
          type="password"
        >
          <LockIcon />
        </Input>
        <p>{errors.passwordConfirm?.message}</p>

        <GreenButton onClick={() => {}}>Confirmar</GreenButton>
      </form>
    </ContainerForm>
  );
};
