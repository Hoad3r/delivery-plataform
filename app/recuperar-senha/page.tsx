"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
  
    try {
      console.log("Tentando enviar email de recuperação para:", values.email);
      
      // Tenta enviar o email de recuperação diretamente
      await sendPasswordResetEmail(auth, values.email);
      console.log("Email de recuperação enviado com sucesso");
  
      toast({
        title: "Sucesso",
        description: "As instruções para redefinir sua senha foram enviadas para seu email.",
        variant: "default",
      });
  
      setSubmitted(true);
    } catch (error: unknown) {
      console.error("Erro ao enviar email de recuperação:", error);
  
      let errorMessage = "Ocorreu um erro ao tentar enviar o email de recuperação.";
  
      if (error instanceof Error) {
        console.log("Tipo de erro:", error.message);
        
        if (error.message === "auth/invalid-email") {
          errorMessage = "O email fornecido é inválido.";
        } else if (error.message === "auth/too-many-requests") {
          errorMessage = "Muitas tentativas. Por favor, tente novamente mais tarde.";
        } else if (error.message === "auth/user-not-found") {
          errorMessage = "Não encontramos uma conta cadastrada com este email.";
        }
      }
  
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
