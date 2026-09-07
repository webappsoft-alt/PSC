import { View } from "react-native";
import BikeQuantitySelector from "./BikeQuantitySelector";

const VehicleQuantityList = ({
  vehicles = [],
  quantities = {},
  onQuantityChange,
  marginTop = 0,
}) => {
  const handleQuantityChange = (vehicleType, value) => {
    onQuantityChange({
      ...quantities,
      [vehicleType]: value,
    });
  };

  return (
    <View style={{ marginTop }}>
      {vehicles.map((vehicle, index) => (
        <BikeQuantitySelector
          key={vehicle.key || vehicle.title}
          title={vehicle.title}
          value={quantities[vehicle.key] || 0}
          onValueChange={(value) => handleQuantityChange(vehicle.key, value)}
          marginTop={index > 0 ? 20 : 0}
        />
      ))}
    </View>
  );
};

export default VehicleQuantityList;