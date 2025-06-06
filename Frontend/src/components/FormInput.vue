<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "text",
  },
  placeholder: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const updateValue = event => {
  emit("update:modelValue", event.target.value);
};
</script>

<template>
   <div class="space-y-2"
    > <label class="block text-sm font-semibold text-gray-700"
      > {{ label }} <span v-if="required" class="text-red-500 ml-1">*</span> </label
    > <div class="relative group"
      > <input
        :type="type"
        :placeholder="placeholder"
        class="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
        :value="modelValue"
        @input="updateValue"
        :required="required"
      /> <div
        class="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 -z-10 blur-sm"
      ></div
      > </div
    > </div
  >
</template>

