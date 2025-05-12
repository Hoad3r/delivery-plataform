"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    console.log("=== INÍCIO DO PROCESSO DE RECUPERAÇÃO ===");
    console.log("Email recebido:", values.email);
  
    try {
      console.log("1. Verificando se o email existe no banco de dados...");
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", values.email));
      const querySnapshot = await getDocs(q);
      
      console.log("2. Resultado da busca:", querySnapshot.empty ? "Email não encontrado" : "Email encontrado");

      if (querySnapshot.empty) {
        console.log("3. Email não encontrado - redirecionando para registro");
        toast({
          title: "Conta não encontrada",
          description: "Ops! Parece que você ainda não tem uma conta conosco. Que tal se cadastrar?",
          variant: "destructive",
        });
        router.push("/registro");
        return;
      }

      console.log("4. Email encontrado, enviando email de recuperação...");
      await sendPasswordResetEmail(auth, values.email);
      console.log("5. Email de recuperação enviado com sucesso");
  
      toast({
        title: "Sucesso",
        description: "Enviamos as instruções para redefinir sua senha.",
        variant: "default",
      });
  
      setSubmitted(true);
    } catch (error: any) {
      console.log("=== ERRO DETECTADO ===");
      console.log("Erro completo:", error);
      console.log("Tipo do erro:", typeof error);
      console.log("Código do erro:", error?.code);
      console.log("Mensagem do erro:", error?.message);
  
      if (error?.code === "auth/invalid-email") {
        toast({
          title: "Erro",
          description: "O email fornecido é inválido.",
          variant: "destructive",
        });
      } else if (error?.code === "auth/too-many-requests") {
        toast({
          title: "Erro",
          description: "Muitas tentativas. Tente mais tarde.",
          variant: "destructive",
        });
      } else {
        console.log("Erro desconhecido:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao tentar enviar o email de recuperação.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      console.log("=== FIM DO PROCESSO DE RECUPERAÇÃO ===");
    }
  }
  
  

  return (
    <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-light mb-2">Recuperar Senha</h1>
          <p className="text-neutral-500">Enviaremos instruções para seu email</p>
        </div>
        <div className="border border-neutral-200 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-light mb-2">Email Enviado</h2>
              <p className="text-neutral-500 mb-4">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="rounded-none border-black text-black hover:bg-black hover:text-white"
                >
                  Voltar para Login
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="rounded-none mt-1"
                          placeholder="Digite seu email"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full rounded-none bg-black text-white hover:bg-neutral-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Instruções"}
                </Button>
              </form>
            </Form>
          )}
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-500">
            Lembrou sua senha?{" "}
            <Link href="/login" className="text-black hover:underline">
              Voltar para login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
