"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Check, MapPin, Plus, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"

// Define validation schema
const addressSchema = z.object({
  nickname: z.string().min(1, "Nome do endereço é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipcode: z.string().min(8, "CEP deve ter 8 dígitos"),
  isDefault: z.boolean().optional(),
})

type AddressFormValues = z.infer<typeof addressSchema>

type Address = AddressFormValues & {
  id: string
}

export default function AddressesPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  // Initialize form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      nickname: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipcode: "",
      isDefault: false,
    },
  })

  // Load addresses
  useEffect(() => {
    // In a real app, this would fetch from an API
    // For now, load from localStorage
    try {
      const savedAddresses = localStorage.getItem("userAddresses")
      if (savedAddresses) {
        const parsedAddresses = JSON.parse(savedAddresses)
        if (Array.isArray(parsedAddresses)) {
          setAddresses(parsedAddresses)
        }
      }
    } catch (error) {
      console.error("Failed to parse addresses from localStorage:", error)
      setAddresses([])
    }
  }, [])

  // Save addresses to localStorage when they change
  useEffect(() => {
    try {
      if (addresses && addresses.length > 0) {
        localStorage.setItem("userAddresses", JSON.stringify(addresses))
      }
    } catch (error) {
      console.error("Failed to save addresses to localStorage:", error)
    }
  }, [addresses])

  // Reset form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      form.reset({
        nickname: editingAddress.nickname,
        street: editingAddress.street,
        number: editingAddress.number,
        complement: editingAddress.complement || "",
        neighborhood: editingAddress.neighborhood,
        city: editingAddress.city,
        state: editingAddress.state,
        zipcode: editingAddress.zipcode,
        isDefault: editingAddress.isDefault || false,
      })
    } else {
      form.reset({
        nickname: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zipcode: "",
        isDefault: addresses.length === 0, // Make default if it's the first address
      })
    }
  }, [editingAddress, form, addresses.length])

  // Handle form submission
  async function onSubmit(values: AddressFormValues) {
    setIsLoading(true)

    try {
      if (editingAddress) {
        // Update existing address
        const updatedAddresses = addresses.map((addr) =>
          addr.id === editingAddress.id
            ? { ...values, id: addr.id }
            : values.isDefault
              ? { ...addr, isDefault: false }
              : addr,
        )
        setAddresses(updatedAddresses)

        toast({
          title: "Endereço atualizado",
          description: `O endereço "${values.nickname}" foi atualizado com sucesso.`,
        })
      } else {
        // Add new address
        const newAddress: Address = {
          ...values,
          id: `address_${Date.now()}`,
        }

        if (values.isDefault) {
          // If the new address is default, remove default from other addresses
          const updatedAddresses = addresses.map((addr) => ({
            ...addr,
            isDefault: false,
          }))
          setAddresses([...updatedAddresses, newAddress])
        } else {
          setAddresses([...addresses, newAddress])
        }

        toast({
          title: "Endereço adicionado",
          description: `O endereço "${values.nickname}" foi adicionado com sucesso.`,
        })
      }

      // Close dialog and reset form
      setDialogOpen(false)
      setEditingAddress(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o endereço.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle address deletion
  function handleDeleteAddress(id: string) {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id)
    setAddresses(updatedAddresses)

    toast({
      title: "Endereço removido",
      description: "Seu endereço foi removido com sucesso.",
    })

    setDeleteDialogOpen(false)
    setAddressToDelete(null)
  }

  // Set address as default
  function setAsDefault(id: string) {
    const updatedAddresses = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }))
    setAddresses(updatedAddresses)

    toast({
      title: "Endereço padrão atualizado",
      description: "Seu endereço padrão foi atualizado com sucesso.",
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light">Meus Endereços</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-none border-black text-black hover:bg-black hover:text-white"
              onClick={() => setEditingAddress(null)}
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Editar Endereço" : "Adicionar Endereço"}</DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {editingAddress ? "atualizar seu" : "adicionar um novo"} endereço.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Endereço</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Casa, Trabalho"
                          className="rounded-none"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} className="rounded-none" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} className="rounded-none" disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-none" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value === "true")}
                          defaultValue={field.value ? "true" : "false"}
                          className="flex flex-row space-x-3"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="default-yes" />
                            <FormLabel htmlFor="default-yes" className="font-normal cursor-pointer">
                              Sim
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="default-no" />
                            <FormLabel htmlFor="default-no" className="font-normal cursor-pointer">
                              Não
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Endereço padrão</FormLabel>
                        <p className="text-sm text-muted-foreground">Definir como endereço padrão para entrega</p>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    className="rounded-none bg-black text-white hover:bg-neutral-800"
                    disabled={isLoading}
                  >
                    {isLoading ? "Salvando..." : "Salvar Endereço"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-300">
          <MapPin className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum endereço cadastrado</h3>
          <p className="text-neutral-500 mb-6">
            Você ainda não possui endereços cadastrados. Adicione seu primeiro endereço para facilitar suas compras.
          </p>
          <Button
            variant="outline"
            className="rounded-none border-black text-black hover:bg-black hover:text-white"
            onClick={() => {
              setEditingAddress(null)
              setDialogOpen(true)
            }}
          >
            Adicionar Endereço
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div key={address.id} className="border border-neutral-200 p-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <h3 className="font-medium">{address.nickname}</h3>
                    {address.isDefault && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {address.street}, {address.number} {address.complement && `, ${address.complement}`}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {address.neighborhood}, {address.city} - {address.state}
                  </p>
                  <p className="text-sm text-neutral-600">CEP: {address.zipcode}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingAddress(address)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog
                    open={deleteDialogOpen && addressToDelete === address.id}
                    onOpenChange={(open) => {
                      setDeleteDialogOpen(open)
                      if (!open) setAddressToDelete(null)
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => setAddressToDelete(address.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Endereço</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-none bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {!address.isDefault && (
                <>
                  <Separator className="my-3" />
                  <Button variant="link" className="h-auto p-0 text-primary" onClick={() => setAsDefault(address.id)}>
                    <Check className="h-4 w-4 mr-1" /> Definir como padrão
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

